"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Download } from "lucide-react";
import type { RegistrationResult } from "@isociety/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, ApiError } from "@/lib/api-client";
import { generateBadgeDataUrl } from "@/lib/badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSystemTheme } from "@/lib/use-system-theme";

export default function RegistrationSuccessPage() {
  const params = useParams<{ eventId: string; attendeeId: string }>();
  const theme = useSystemTheme();
  const themeClass = cn("text-foreground", theme === "dark" ? "dark" : "");
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ data: RegistrationResult }>(`/public/registrations/${params.attendeeId}`)
      .then((res) => setResult(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your registration."));
  }, [params.attendeeId]);

  async function handleDownloadBadge() {
    if (!result) return;
    setIsDownloading(true);
    try {
      const dataUrl = await generateBadgeDataUrl({
        logoUrl: result.event.logoUrl,
        attendeeName: result.attendee.fullName,
        registrationNumber: result.attendee.registrationNumber,
        eventName: result.event.name,
        eventDate: formatDate(result.event.eventDate),
        qrCodeDataUrl: result.qrCodeDataUrl,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${result.attendee.fullName}-badge.png`;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  }

  if (error) {
    return (
      <main className={cn("flex min-h-screen items-center justify-center bg-muted px-4", themeClass)}>
        <p className="text-sm text-destructive">{error}</p>
      </main>
    );
  }

  if (!result) {
    return (
      <main className={cn("flex min-h-screen items-center justify-center bg-muted px-4", themeClass)}>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <main className={cn("flex min-h-screen items-center justify-center bg-muted px-4 py-8", themeClass)}>
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="mb-2 h-12 w-12 text-primary" />
          <CardTitle className="text-2xl">You&apos;re registered!</CardTitle>
          <p className="text-sm text-muted-foreground">{result.event.name}</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="rounded-md bg-primary/10 px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">Registration Number</p>
            <p className="font-mono text-lg font-semibold text-primary">
              {result.attendee.registrationNumber}
            </p>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not a remote asset */}
          <img
            src={result.qrCodeDataUrl}
            alt="Your check-in QR code"
            className="h-44 w-44 rounded-md border border-border bg-white p-2"
          />
          <p className="text-center text-xs text-muted-foreground">
            Show this QR code at check-in on the day of the event.
          </p>

          <div className="flex w-full flex-col gap-2 pt-2">
            <Button onClick={handleDownloadBadge} disabled={isDownloading}>
              <Download className="h-4 w-4" />
              {isDownloading ? "Preparing badge..." : "Download Badge"}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/register/${params.eventId}`}>Return Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
