"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PublicEventPayload, RegistrationResult } from "@isociety/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicRegistrationForm } from "@/components/forms/public-registration-form";
import { apiClient, ApiError } from "@/lib/api-client";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSystemTheme } from "@/lib/use-system-theme";

export default function PublicRegistrationPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const theme = useSystemTheme();
  const themeClass = cn("text-foreground", theme === "dark" ? "dark" : "");
  const [data, setData] = useState<PublicEventPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ data: PublicEventPayload }>(`/public/events/${params.eventId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "This event could not be found."));
  }, [params.eventId]);

  async function handleSubmit(responses: Record<string, string | string[]>) {
    const res = await apiClient.post<{ data: RegistrationResult }>(
      `/public/events/${params.eventId}/register`,
      { responses }
    );
    router.push(`/register/${params.eventId}/success/${res.data.attendee.id}`);
  }

  if (error) {
    return (
      <main className={cn("flex min-h-screen items-center justify-center bg-muted px-4", themeClass)}>
        <p className="text-sm text-destructive">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className={cn("flex min-h-screen items-center justify-center bg-muted px-4", themeClass)}>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </main>
    );
  }

  const { event, form } = data;

  return (
    <main className={cn("relative min-h-screen bg-muted", themeClass)}>
      {event.bannerUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
        <img src={event.bannerUrl} alt="" className="h-48 w-full object-cover sm:h-64" />
      )}

      <div className="mx-auto max-w-xl px-4 py-8">
        <Card>
          <CardHeader className="items-center text-center">
            {event.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
              <img src={event.logoUrl} alt={event.name} className="mb-2 h-16 w-16 rounded-full object-cover" />
            )}
            <CardTitle className="text-2xl">{event.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatDate(event.eventDate)} - {formatTime(event.startTime)} to {formatTime(event.endTime)}
              {event.venue ? ` - ${event.venue}` : ""}
            </p>
            {event.description && <p className="pt-2 text-sm text-muted-foreground">{event.description}</p>}
          </CardHeader>
          <CardContent>
            {event.registrationOpen ? (
              <PublicRegistrationForm fields={form.fields} onSubmit={handleSubmit} />
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                {event.closedReason ?? "Registration is closed for this event."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
