"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { QrCode, Search } from "lucide-react";
import type { AttendeeSummary, Paginated } from "@isociety/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient, ApiError } from "@/lib/api-client";

type Mode = "scan" | "manual";

interface FeedbackState {
  kind: "success" | "error";
  message: string;
}

// Ignore re-firing the same decoded payload while it's still sitting in
// front of the camera - html5-qrcode's success callback fires on every
// frame it manages to decode, not just once per code.
const RESCAN_COOLDOWN_MS = 4000;

export default function CheckInPage() {
  const params = useParams<{ id: string }>();
  const [mode, setMode] = useState<Mode>("scan");
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AttendeeSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  // Loosely typed - html5-qrcode is only installed on the user's machine
  // (see apps/web/package.json), not in every environment this file might
  // be typechecked in.
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const lastScanRef = useRef<{ payload: string; at: number } | null>(null);

  async function refreshCounts() {
    const [all, checked] = await Promise.all([
      apiClient.get<{ success: boolean } & Paginated<AttendeeSummary>>(
        `/events/${params.id}/attendees?page=1&pageSize=1`
      ),
      apiClient.get<{ success: boolean } & Paginated<AttendeeSummary>>(
        `/events/${params.id}/attendees?page=1&pageSize=1&checkedIn=true`
      ),
    ]);
    setTotalAttendees(all.pagination.total);
    setCheckedInCount(checked.pagination.total);
  }

  useEffect(() => {
    refreshCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleScan(payload: string) {
    const now = Date.now();
    const last = lastScanRef.current;
    if (last && last.payload === payload && now - last.at < RESCAN_COOLDOWN_MS) return;
    lastScanRef.current = { payload, at: now };

    try {
      const res = await apiClient.post<{ data: { attendee: AttendeeSummary } }>(
        `/events/${params.id}/checkin/scan`,
        { payload }
      );
      setFeedback({ kind: "success", message: `Checked in: ${res.data.attendee.fullName}` });
      refreshCounts();
    } catch (err) {
      setFeedback({
        kind: "error",
        message: err instanceof ApiError ? err.message : "Check-in failed.",
      });
    }
  }

  // --- Camera scanner lifecycle ---
  useEffect(() => {
    if (mode !== "scan") return;
    let cancelled = false;

    import("html5-qrcode")
      .then(({ Html5Qrcode }) => {
        if (cancelled) return;
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        return scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (decodedText: string) => handleScan(decodedText),
          undefined
        );
      })
      .catch(() => {
        if (!cancelled) {
          setCameraError("Couldn't access the camera. Grant camera permission and reload the page.");
        }
      });

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  // --- Manual search: always shows attendees who are NOT yet checked in,
  // optionally narrowed by a search query, paginated.
  async function loadNotCheckedIn(query: string, pageArg: number) {
    setIsSearching(true);
    try {
      const searchParam = query ? `&search=${encodeURIComponent(query)}` : "";
      const res = await apiClient.get<{ success: boolean } & Paginated<AttendeeSummary>>(
        `/events/${params.id}/attendees?page=${pageArg}&pageSize=${PAGE_SIZE}&checkedIn=false${searchParam}`
      );
      setResults(res.data);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages);
    } finally {
      setIsSearching(false);
    }
  }

  // Load the first page of not-checked-in attendees as soon as manual
  // search is opened, so there's something to check in without typing.
  useEffect(() => {
    if (mode !== "manual") return;
    loadNotCheckedIn("", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, params.id]);

  function runSearch(query: string) {
    setSearch(query);
    loadNotCheckedIn(query, 1);
  }

  async function handleManualCheckIn(attendee: AttendeeSummary) {
    setBusyId(attendee.id);
    try {
      const res = await apiClient.post<{ data: { attendee: AttendeeSummary } }>(
        `/events/${params.id}/attendees/${attendee.id}/checkin`
      );
      // Checked-in attendees drop out of this "not checked in" list.
      setResults((prev) => prev.filter((a) => a.id !== attendee.id));
      setFeedback({ kind: "success", message: `Checked in: ${res.data.attendee.fullName}` });
      refreshCounts();
    } catch (err) {
      setFeedback({
        kind: "error",
        message: err instanceof ApiError ? err.message : "Check-in failed.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Check-in</h1>
          <p className="text-sm text-muted-foreground">
            {checkedInCount} / {totalAttendees} checked in
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/events/${params.id}/attendees`}>View attendees</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === "scan" ? "default" : "outline"}
          size="lg"
          onClick={() => setMode("scan")}
        >
          <QrCode className="h-4 w-4" />
          Scan QR
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          size="lg"
          onClick={() => setMode("manual")}
        >
          <Search className="h-4 w-4" />
          Manual search
        </Button>
      </div>

      {feedback && (
        <p
          className={
            feedback.kind === "success"
              ? "rounded-md bg-primary/10 p-3 text-sm text-primary"
              : "rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          }
        >
          {feedback.message}
        </p>
      )}

      {mode === "scan" ? (
        <Card>
          <CardHeader>
            <CardTitle>Point the camera at an attendee&apos;s QR code</CardTitle>
          </CardHeader>
          <CardContent>
            {cameraError ? (
              <p className="text-sm text-destructive">{cameraError}</p>
            ) : (
              <div id="qr-reader" className="mx-auto w-full max-w-sm overflow-hidden rounded-md" />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Search attendees</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              placeholder="Search by name, email, phone, or reg. number..."
              value={search}
              onChange={(e) => runSearch(e.target.value)}
              className="max-w-sm"
            />
            {isSearching ? (
              <p className="text-sm text-muted-foreground">Searching...</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {search ? "No attendees match." : "Everyone is checked in."}
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  {results.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{a.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.registrationNumber} - {a.email ?? a.phone ?? "no contact info"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Not checked in</Badge>
                        <Button disabled={busyId === a.id} onClick={() => handleManualCheckIn(a)}>
                          Check in
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="outline"
                      disabled={page <= 1 || isSearching}
                      onClick={() => loadNotCheckedIn(search, page - 1)}
                    >
                      Previous
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </p>
                    <Button
                      variant="outline"
                      disabled={page >= totalPages || isSearching}
                      onClick={() => loadNotCheckedIn(search, page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
