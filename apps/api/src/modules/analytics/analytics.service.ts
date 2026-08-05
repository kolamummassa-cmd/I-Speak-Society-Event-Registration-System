import dayjs from "dayjs";
import type { DistributionItem, EventAnalytics, TimelinePoint } from "@isociety/shared";
import { AppError } from "../../middleware/errorHandler";
import * as eventRepository from "../events/event.repository";
import * as analyticsRepository from "./analytics.repository";

function toDistribution(counts: Map<string, number>, total: number): DistributionItem[] {
  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// Keeps the top `n` keys by count and folds everything else into "Other" -
// useful for country distribution, where a large event can have dozens of
// distinct values that would otherwise crowd out the meaningful ones.
function bucketTopN(counts: Map<string, number>, n: number): Map<string, number> {
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const result = new Map(sorted.slice(0, n));
  const rest = sorted.slice(n);
  if (rest.length > 0) {
    const restTotal = rest.reduce((sum, [, count]) => sum + count, 0);
    result.set("Other", restTotal);
  }
  return result;
}

export async function getEventAnalytics(eventId: string): Promise<EventAnalytics> {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError(404, "Event not found");

  const attendees = await analyticsRepository.findAttendeeAnalyticsData(eventId);
  const total = attendees.length;
  const checkedInAttendees = attendees.filter((a) => a.checkedIn);
  const checkInRate = total > 0 ? Math.round((checkedInAttendees.length / total) * 100) : 0;

  // Registrations, bucketed by calendar day.
  const registrationCounts = new Map<string, number>();
  for (const a of attendees) {
    const key = dayjs(a.registeredAt).format("YYYY-MM-DD");
    registrationCounts.set(key, (registrationCounts.get(key) ?? 0) + 1);
  }
  const registrationTimeline: TimelinePoint[] = Array.from(registrationCounts.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, count]) => ({ label: dayjs(key).format("MMM D"), count }));

  // Check-ins, bucketed by hour (truncated timestamp, not a parsed string,
  // so we don't need dayjs's customParseFormat plugin to read it back).
  const checkInBuckets = new Map<string, { count: number; sampleDate: Date }>();
  for (const a of checkedInAttendees) {
    if (!a.checkInTime) continue;
    const truncated = dayjs(a.checkInTime).minute(0).second(0).millisecond(0);
    const key = truncated.toISOString();
    const existing = checkInBuckets.get(key);
    checkInBuckets.set(key, { count: (existing?.count ?? 0) + 1, sampleDate: truncated.toDate() });
  }
  const checkInTimeline: TimelinePoint[] = Array.from(checkInBuckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, bucket]) => ({ label: dayjs(bucket.sampleDate).format("h A"), count: bucket.count }));

  // Gender distribution.
  const genderCounts = new Map<string, number>();
  for (const a of attendees) {
    const key = a.gender?.trim() || "Not provided";
    genderCounts.set(key, (genderCounts.get(key) ?? 0) + 1);
  }
  const genderDistribution = toDistribution(genderCounts, total);

  // Country distribution - top 8, rest folded into "Other".
  const countryCounts = new Map<string, number>();
  for (const a of attendees) {
    const key = a.country?.trim() || "Not provided";
    countryCounts.set(key, (countryCounts.get(key) ?? 0) + 1);
  }
  const countryDistribution = toDistribution(bucketTopN(countryCounts, 8), total);

  // Check-in method - relative to checked-in attendees, not everyone, since
  // "not checked in" isn't a check-in method.
  const methodCounts = new Map<string, number>();
  for (const a of checkedInAttendees) {
    const key = a.checkInMethod === "QR_SCAN" ? "QR Scan" : "Manual";
    methodCounts.set(key, (methodCounts.get(key) ?? 0) + 1);
  }
  const checkInMethodBreakdown = toDistribution(methodCounts, checkedInAttendees.length);

  return {
    totals: { totalRegistered: total, totalCheckedIn: checkedInAttendees.length, checkInRate },
    registrationTimeline,
    checkInTimeline,
    genderDistribution,
    countryDistribution,
    checkInMethodBreakdown,
  };
}
