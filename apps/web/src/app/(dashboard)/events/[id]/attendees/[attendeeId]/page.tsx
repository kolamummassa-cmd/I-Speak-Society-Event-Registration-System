"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AttendeeDetail } from "@isociety/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient, formatApiError } from "@/lib/api-client";
import { formatDate, formatTime } from "@/lib/format";

interface DefaultFieldsState {
  fullName: string;
  phone: string;
  email: string;
  organization: string;
  position: string;
  gender: string;
  country: string;
  city: string;
}

function toDefaultFields(a: AttendeeDetail): DefaultFieldsState {
  return {
    fullName: a.fullName,
    phone: a.phone ?? "",
    email: a.email ?? "",
    organization: a.organization ?? "",
    position: a.position ?? "",
    gender: a.gender ?? "",
    country: a.country ?? "",
    city: a.city ?? "",
  };
}

function parseResponseValue(fieldType: string, value: string): string {
  if (fieldType === "CHECKBOX") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.join(", ") : value;
    } catch {
      return value;
    }
  }
  return value;
}

export default function AttendeeDetailPage() {
  const params = useParams<{ id: string; attendeeId: string }>();
  const router = useRouter();
  const [attendee, setAttendee] = useState<AttendeeDetail | null>(null);
  const [fields, setFields] = useState<DefaultFieldsState | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ data: { attendee: AttendeeDetail } }>(
        `/events/${params.id}/attendees/${params.attendeeId}`
      )
      .then((res) => {
        setAttendee(res.data.attendee);
        setFields(toDefaultFields(res.data.attendee));
        const initialResponses: Record<string, string> = {};
        for (const r of res.data.attendee.responses) {
          initialResponses[r.fieldId] = parseResponseValue(r.fieldType, r.value);
        }
        setResponses(initialResponses);
      })
      .catch(() => setError("Could not load this attendee."));
  }, [params.id, params.attendeeId]);

  async function handleSave() {
    if (!fields || !attendee) return;
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const responsePayload: Record<string, string | string[]> = {};
      for (const r of attendee.responses) {
        const raw = responses[r.fieldId] ?? "";
        responsePayload[r.fieldId] =
          r.fieldType === "CHECKBOX"
            ? raw
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            : raw;
      }

      const res = await apiClient.patch<{ data: { attendee: AttendeeDetail } }>(
        `/events/${params.id}/attendees/${params.attendeeId}`,
        { ...fields, responses: responsePayload }
      );
      setAttendee(res.data.attendee);
      setFields(toDefaultFields(res.data.attendee));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!attendee) return;
    if (!window.confirm(`Remove "${attendee.fullName}" from this event? This cannot be undone.`)) {
      return;
    }
    await apiClient.delete(`/events/${params.id}/attendees/${params.attendeeId}`);
    router.push(`/events/${params.id}/attendees`);
  }

  if (error && !attendee) return <p className="text-sm text-destructive">{error}</p>;
  if (!attendee || !fields) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{attendee.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            {attendee.registrationNumber} - Registered {formatDate(attendee.registeredAt)} at{" "}
            {formatTime(attendee.registeredAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={attendee.checkedIn ? "default" : "secondary"}>
            {attendee.checkedIn ? "Checked in" : "Not checked in"}
          </Badge>
          <Button asChild variant="outline">
            <Link href={`/events/${params.id}/attendees`}>Back to attendees</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fields.fullName}
              onChange={(e) => setFields({ ...fields, fullName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={fields.email}
              onChange={(e) => setFields({ ...fields, email: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={fields.phone}
              onChange={(e) => setFields({ ...fields, phone: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              value={fields.organization}
              onChange={(e) => setFields({ ...fields, organization: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={fields.position}
              onChange={(e) => setFields({ ...fields, position: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gender">Gender</Label>
            <Input
              id="gender"
              value={fields.gender}
              onChange={(e) => setFields({ ...fields, gender: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={fields.country}
              onChange={(e) => setFields({ ...fields, country: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={fields.city}
              onChange={(e) => setFields({ ...fields, city: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {attendee.responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional questions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {attendee.responses.map((r) => (
              <div key={r.fieldId} className="flex flex-col gap-1.5">
                <Label htmlFor={r.fieldId}>{r.label}</Label>
                {r.fieldType === "LONG_TEXT" ? (
                  <Textarea
                    id={r.fieldId}
                    value={responses[r.fieldId] ?? ""}
                    onChange={(e) => setResponses({ ...responses, [r.fieldId]: e.target.value })}
                  />
                ) : r.fieldType === "TOGGLE" ? (
                  <Select
                    id={r.fieldId}
                    value={responses[r.fieldId] ?? ""}
                    onChange={(e) => setResponses({ ...responses, [r.fieldId]: e.target.value })}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </Select>
                ) : r.fieldType === "FILE" ? (
                  <p className="text-sm text-muted-foreground">
                    File uploads can&apos;t be edited here yet.
                  </p>
                ) : (
                  <Input
                    id={r.fieldId}
                    value={responses[r.fieldId] ?? ""}
                    onChange={(e) => setResponses({ ...responses, [r.fieldId]: e.target.value })}
                    placeholder={r.fieldType === "CHECKBOX" ? "Comma-separated values" : undefined}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleDelete}>
          Delete attendee
        </Button>
        <div className="flex items-center gap-3">
          {saved && <p className="text-sm text-muted-foreground">Saved.</p>}
          <Button disabled={isSaving} onClick={handleSave}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
