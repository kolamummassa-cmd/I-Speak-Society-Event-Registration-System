"use client";

import { useEffect, useState } from "react";
import { Download, Printer, Share2 } from "lucide-react";
import type { EventSummary } from "@isociety/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateQrPosterDataUrl } from "@/lib/qr-poster";
import { formatDate } from "@/lib/format";

interface QrPosterDialogProps {
  event: EventSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// One composed image (banner on top, QR code on the bottom, event name/date
// in between) drives the on-screen preview, download, print, and share
// actions - so all four always show the exact same thing.
export function QrPosterDialog({ event, open, onOpenChange }: QrPosterDialogProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !event.qrCodeImageUrl) return;
    let cancelled = false;
    setIsGenerating(true);
    setError(null);
    setNotice(null);
    generateQrPosterDataUrl({
      bannerUrl: event.bannerUrl,
      qrCodeUrl: event.qrCodeImageUrl,
      eventName: event.name,
      eventDate: formatDate(event.eventDate),
      venue: event.venue,
    })
      .then((url) => {
        if (!cancelled) setPosterUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("Could not generate the poster.");
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, event.qrCodeImageUrl, event.bannerUrl, event.name, event.eventDate, event.venue]);

  function handleDownload() {
    if (!posterUrl) return;
    const link = document.createElement("a");
    link.href = posterUrl;
    link.download = `${event.name}-qr-poster.png`;
    link.click();
  }

  function handlePrint() {
    if (!posterUrl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>${event.name} - QR poster</title></head>
        <body style="margin:0;display:flex;justify-content:center;">
          <img
            src="${posterUrl}"
            style="width:100%;max-width:500px;height:auto;"
            onload="window.print();"
          />
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  async function handleShare() {
    setNotice(null);
    if (!posterUrl) return;
    try {
      const blob = await (await fetch(posterUrl)).blob();
      const file = new File([blob], `${event.name}-qr-poster.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: event.name,
          text: `Scan to register for ${event.name}`,
        });
        return;
      }
    } catch {
      // User cancelled the share sheet, or the browser threw - fall through
      // to the clipboard fallback below rather than leaving the button dead.
    }
    if (event.registrationUrl) {
      await navigator.clipboard.writeText(event.registrationUrl);
      setNotice("Sharing isn't supported in this browser - registration link copied instead.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Printable QR poster</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {isGenerating ? (
            <p className="py-12 text-sm text-muted-foreground">Preparing poster...</p>
          ) : error ? (
            <p className="py-12 text-sm text-destructive">{error}</p>
          ) : posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- locally generated data URL
            <img
              src={posterUrl}
              alt={`Registration poster for ${event.name}`}
              className="w-full rounded-lg border border-border shadow-sm"
            />
          ) : null}

          {notice && <p className="text-center text-xs text-muted-foreground">{notice}</p>}

          <div className="flex w-full flex-wrap justify-center gap-2">
            <Button variant="accent" size="sm" disabled={!posterUrl} onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" size="sm" disabled={!posterUrl} onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" disabled={!posterUrl} onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
