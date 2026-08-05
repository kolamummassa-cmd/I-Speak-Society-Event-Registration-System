"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Copy, Download, RefreshCw } from "lucide-react";
import type { EventSummary } from "@isociety/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, formatApiError } from "@/lib/api-client";
import { formatDate, formatTime } from "@/lib/format";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  function load() {
    apiClient
      .get<{ data: { event: EventSummary } }>(`/events/${params.id}`)
      .then((res) => setEvent(res.data.event))
      .catch(() => setError("Could not load this event."));
  }

  useEffect(load, [params.id]);

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError(null);
    try {
      const res = await apiClient.post<{ data: { event: EventSummary } }>(
        `/events/${params.id}/qrcode`
      );
      setEvent(res.data.event);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleCopyLink() {
    if (!event?.registrationUrl) return;
    await navigator.clipboard.writeText(event.registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // A plain <a download> doesn't reliably trigger a download for a
  // cross-origin URL like Cloudinary's - most browsers just navigate to it
  // instead. Fetching the image and saving it via a local blob URL works
  // consistently everywhere.
  async function handleDownload() {
    if (!event?.qrCodeImageUrl) return;
    const res = await fetch(event.qrCodeImageUrl);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${event.name}-qr-code.png`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  }

  if (error && !event) return <p className="text-sm text-destructive">{error}</p>;
  if (!event) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{event.name}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(event.eventDate)} - {formatTime(event.startTime)} to{" "}
            {formatTime(event.endTime)}
            {event.venue ? ` - ${event.venue}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}/checkin`}>Check-in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}/attendees`}>View attendees</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}/analytics`}>Analytics</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}/form`}>Registration form</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}/edit`}>Edit event</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration QR code</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {event.qrCodeImageUrl ? (
            <div className="flex flex-wrap items-start gap-6">
              {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL */}
              <img
                src={event.qrCodeImageUrl}
                alt={`QR code for ${event.name}`}
                className="h-48 w-48 rounded-md border border-border bg-white p-2"
              />
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm font-medium">Registration link</p>
                  <p className="max-w-md break-all text-sm text-muted-foreground">
                    {event.registrationUrl}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy link"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                    Download QR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRegenerating}
                    onClick={handleRegenerate}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                QR code generation didn&apos;t complete when this event was created.
              </p>
              <div>
                <Button disabled={isRegenerating} onClick={handleRegenerate}>
                  <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                  Generate QR code
                </Button>
              </div>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
