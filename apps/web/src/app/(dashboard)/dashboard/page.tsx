"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Percent, Plus, Users } from "lucide-react";
import type { DashboardOverview, EventStatus } from "@isociety/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusVariant: Record<EventStatus, "default" | "secondary" | "accent" | "destructive"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  COMPLETED: "accent",
  CANCELLED: "destructive",
};

const statusLabel: Record<EventStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconClassName)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ data: { overview: DashboardOverview } }>("/dashboard/overview")
      .then((res) => setOverview(res.data.overview))
      .catch(() => setError("Could not load the dashboard overview."));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button asChild variant="accent">
          <Link href="/events/new">
            <Plus className="h-4 w-4" />
            Create event
          </Link>
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!overview && !error && <p className="text-sm text-muted-foreground">Loading...</p>}

      {overview && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total events"
              value={String(overview.totalEvents)}
              icon={CalendarDays}
              iconClassName="bg-gradient-to-br from-primary to-[#3b82f6]"
            />
            <StatCard
              label="Total attendees"
              value={String(overview.totalAttendees)}
              icon={Users}
              iconClassName="bg-gradient-to-br from-accent to-[#2dd4bf]"
            />
            <StatCard
              label="Checked in"
              value={String(overview.totalCheckedIn)}
              icon={CheckCircle2}
              iconClassName="bg-gradient-to-br from-success to-[#22c55e]"
            />
            <StatCard
              label="Check-in rate"
              value={`${overview.checkInRate}%`}
              icon={Percent}
              iconClassName="bg-gradient-to-br from-purple to-[#9333ea]"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Events by status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {(Object.keys(overview.eventsByStatus) as EventStatus[]).map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
                  <span className="text-sm text-muted-foreground">{overview.eventsByStatus[status]}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming events</CardTitle>
            </CardHeader>
            <CardContent>
              {overview.upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No upcoming published events. Create or publish one to see it here.
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {overview.upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <Link href={`/events/${event.id}`} className="font-medium hover:underline">
                          {event.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(event.eventDate)}
                          {event.venue ? ` · ${event.venue}` : ""} · {event.attendeeCount} attendee
                          {event.attendeeCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant[event.status]}>{statusLabel[event.status]}</Badge>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/events/${event.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
