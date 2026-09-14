import { prisma } from "@isociety/database";

// A single lightweight, unpaginated query - just the columns the analytics
// service needs to bucket in memory. For the attendee counts this app deals
// with (hundreds to a few thousand per event), that's simpler and more
// portable across databases than raw SQL date_trunc/group-by queries.
export function findAttendeeAnalyticsData(eventId: string) {
  return prisma.attendee.findMany({
    where: { eventId },
    select: {
      registeredAt: true,
      checkedIn: true,
      checkInTime: true,
      checkInMethod: true,
      gender: true,
      country: true,
    },
  });
}
