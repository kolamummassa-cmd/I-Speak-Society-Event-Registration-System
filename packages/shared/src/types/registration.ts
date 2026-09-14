import type { RegistrationForm } from "./form";

// Deliberately narrower than EventSummary - only what a guest needs to see
// on the public registration page. No createdById, no audit info.
export interface PublicEventInfo {
  id: string;
  name: string;
  description: string | null;
  venue: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  organizerName: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  registrationOpen: boolean;
  closedReason: string | null;
}

export interface PublicEventPayload {
  event: PublicEventInfo;
  form: RegistrationForm;
}

export interface RegisteredAttendee {
  id: string;
  registrationNumber: string;
  fullName: string;
}

export interface RegistrationResult {
  attendee: RegisteredAttendee;
  event: PublicEventInfo;
  qrCodeDataUrl: string;
}
