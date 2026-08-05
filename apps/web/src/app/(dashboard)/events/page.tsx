"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { EventStatus, EventSummary, Paginated } from "@isociety/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { formatDate } from "@/lib/format";

const statusVariant: Record<EventStatus, "default" | "secondary" | "accent" | "destructive"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  COMPLETED: "accent",
  CANCELLED: "destructive",
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadEvents(query: string) {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "50" });
      if (query) params.set("search", query);
      const res = await apiClient.get<{ success: boolean } & Paginated<EventSummary>>(
        `/events?${params.toString()}`
      );
      setEvents(res.data);
    } catch {
      setError("Could not load events.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadEvents("");
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This also removes its registration form and attendees.`)) {
      return;
    }
    await apiClient.delete(`/events/${id}`);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="h-4 w-4" />
            Create event
          </Link>
        </Button>
      </div>

      <Input
        placeholder="Search events by name..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          loadEvents(e.target.value);
        }}
        className="max-w-sm"
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading events...</p>
        ) : error ? (
          <p className="p-6 text-sm text-destructive">{error}</p>
        ) : events.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No events yet. Create your first one.</p>
        ) : (
          <>
            {/* Below md: stacked cards, no sideways scrolling. */}
            <div className="flex flex-col divide-y divide-border md:hidden">
              {events.map((event) => (
                <div key={event.id} className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/events/${event.id}`} className="font-medium hover:underline">
                      {event.name}
                    </Link>
                    <Badge variant={statusVariant[event.status]}>{event.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(event.eventDate)}
                    {event.venue ? ` · ${event.venue}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.attendeeCount} attendee{event.attendeeCount === 1 ? "" : "s"}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/events/${event.id}`}>View</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/events/${event.id}/edit`}>Edit</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id, event.name)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* md and up: full table. */}
            <table className="hidden w-full text-sm md:table">
              <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Venue</th>
                  <th className="p-4 font-medium">Attendees</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">
                      <Link href={`/events/${event.id}`} className="hover:underline">
                        {event.name}
                      </Link>
                    </td>
                    <td className="p-4">{formatDate(event.eventDate)}</td>
                    <td className="p-4 text-muted-foreground">{event.venue ?? "-"}</td>
                    <td className="p-4">{event.attendeeCount}</td>
                    <td className="p-4">
                      <Badge variant={statusVariant[event.status]}>{event.status}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/events/${event.id}`}>View</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/events/${event.id}/edit`}>Edit</Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id, event.name)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>
    </div>
  );
}
