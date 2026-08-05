"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AttendeeSummary, Paginated } from "@isociety/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { formatDate, formatTime } from "@/lib/format";

const PAGE_SIZE = 20;

type CheckInFilter = "all" | "true" | "false";

export default function AttendeesPage() {
  const params = useParams<{ id: string }>();
  const [attendees, setAttendees] = useState<AttendeeSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [checkedIn, setCheckedIn] = useState<CheckInFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(pageToLoad: number, searchValue: string, checkedInValue: CheckInFilter) {
    setIsLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ page: String(pageToLoad), pageSize: String(PAGE_SIZE) });
      if (searchValue) q.set("search", searchValue);
      if (checkedInValue !== "all") q.set("checkedIn", checkedInValue);
      const res = await apiClient.get<{ success: boolean } & Paginated<AttendeeSummary>>(
        `/events/${params.id}/attendees?${q.toString()}`
      );
      setAttendees(res.data);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      setError("Could not load attendees.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load(1, search, checkedIn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Remove "${name}" from this event? This cannot be undone.`)) return;
    await apiClient.delete(`/events/${params.id}/attendees/${id}`);
    load(page, search, checkedIn);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Attendees</h1>
          <p className="text-sm text-muted-foreground">{total} registered</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/events/${params.id}`}>Back to event</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name, email, phone, or reg. number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            load(1, e.target.value, checkedIn);
          }}
          className="max-w-sm"
        />
        <Select
          value={checkedIn}
          onChange={(e) => {
            const value = e.target.value as CheckInFilter;
            setCheckedIn(value);
            load(1, search, value);
          }}
          className="w-auto"
        >
          <option value="all">All attendees</option>
          <option value="true">Checked in</option>
          <option value="false">Not checked in</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading attendees...</p>
        ) : error ? (
          <p className="p-6 text-sm text-destructive">{error}</p>
        ) : attendees.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No attendees match your filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Reg. number</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Organization</th>
                <th className="p-4 font-medium">Registered</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="p-4 font-medium">
                    <Link href={`/events/${params.id}/attendees/${a.id}`} className="hover:underline">
                      {a.fullName}
                    </Link>
                  </td>
                  <td className="p-4 text-muted-foreground">{a.registrationNumber}</td>
                  <td className="p-4 text-muted-foreground">
                    {a.email ?? a.phone ?? "-"}
                  </td>
                  <td className="p-4 text-muted-foreground">{a.organization ?? "-"}</td>
                  <td className="p-4 text-muted-foreground">
                    {formatDate(a.registeredAt)} {formatTime(a.registeredAt)}
                  </td>
                  <td className="p-4">
                    <Badge variant={a.checkedIn ? "default" : "secondary"}>
                      {a.checkedIn ? "Checked in" : "Registered"}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/events/${params.id}/attendees/${a.id}`}>View</Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id, a.fullName)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => load(page - 1, search, checkedIn)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => load(page + 1, search, checkedIn)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
