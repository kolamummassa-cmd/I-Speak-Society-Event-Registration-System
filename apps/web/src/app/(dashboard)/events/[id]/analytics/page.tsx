"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { DistributionItem, EventAnalytics, TimelinePoint } from "@isociety/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

// Plain divs sized by percentage instead of a charting library - keeps this
// dashboard dependency-free, same approach as the hand-rolled badge/QR bits
// from earlier phases.
function TimelineChart({ points }: { points: TimelinePoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  }
  const max = Math.max(...points.map((p) => p.count), 1);
  return (
    <div className="flex items-end gap-3 overflow-x-auto pb-1">
      {points.map((point, i) => (
        <div key={`${point.label}-${i}`} className="flex min-w-10 flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground">{point.count}</span>
          <div
            className="w-6 rounded-t bg-primary"
            style={{ height: `${Math.max((point.count / max) * 120, 4)}px` }}
          />
          <span className="whitespace-nowrap text-[10px] text-muted-foreground">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function DistributionList({ items }: { items: DistributionItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span>{item.label}</span>
            <span className="text-muted-foreground">
              {item.count} &middot; {item.percentage}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EventAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ data: { analytics: EventAnalytics } }>(`/events/${params.id}/analytics`)
      .then((res) => setAnalytics(res.data.analytics))
      .catch(() => setError("Could not load analytics."));
  }, [params.id]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!analytics) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <Button asChild variant="outline">
          <Link href={`/events/${params.id}`}>Back to event</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total registered" value={String(analytics.totals.totalRegistered)} />
        <SummaryCard label="Checked in" value={String(analytics.totals.totalCheckedIn)} />
        <SummaryCard label="Check-in rate" value={`${analytics.totals.checkInRate}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrations over time</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineChart points={analytics.registrationTimeline} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check-ins by hour</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineChart points={analytics.checkInTimeline} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gender</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionList items={analytics.genderDistribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Country</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionList items={analytics.countryDistribution} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check-in method</CardTitle>
        </CardHeader>
        <CardContent>
          <DistributionList items={analytics.checkInMethodBreakdown} />
        </CardContent>
      </Card>
    </div>
  );
}
