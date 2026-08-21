"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { EventSummary, FormField, RegistrationForm, RegistrationResult } from "@isociety/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PublicRegistrationForm } from "@/components/forms/public-registration-form";
import { apiClient, formatApiError } from "@/lib/api-client";

interface ManualRegistrationDialogProps {
  event: EventSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// For attendees at the door without a smartphone to scan the QR code -
// reuses the exact same form guests fill out themselves at /register/[id],
// just submitted by an organizer on the attendee's behalf from the
// dashboard. Stays open after a successful submission (rather than closing)
// since this is typically used to register several walk-ins back to back.
export function ManualRegistrationDialog({ event, open, onOpenChange }: ManualRegistrationDialogProps) {
  const [fields, setFields] = useState<FormField[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRegistered, setLastRegistered] = useState<RegistrationResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLastRegistered(null);
    setFields(null);
    apiClient
      .get<{ data: { form: RegistrationForm } }>(`/events/${event.id}/form`)
      .then((res) => setFields(res.data.form.fields))
      .catch((err) => setError(formatApiError(err)));
  }, [open, event.id]);

  async function handleSubmit(responses: Record<string, string | string[]>) {
    const res = await apiClient.post<{ data: RegistrationResult }>(
      `/public/events/${event.id}/register`,
      { responses }
    );
    setLastRegistered(res.data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manual registration</DialogTitle>
          <DialogDescription>
            For attendees who can&apos;t scan the QR code - fill this in on their behalf.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {lastRegistered ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <div>
              <p className="font-semibold">{lastRegistered.attendee.fullName} is registered</p>
              <p className="font-mono text-sm text-muted-foreground">
                {lastRegistered.attendee.registrationNumber}
              </p>
            </div>
            <Button onClick={() => setLastRegistered(null)}>Register another</Button>
          </div>
        ) : fields ? (
          <PublicRegistrationForm fields={fields} onSubmit={handleSubmit} />
        ) : !error ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading form...</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
