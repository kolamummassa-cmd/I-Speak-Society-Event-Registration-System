export type EventStatus = "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";

export interface EventSummary {
  id: string;
  name: string;
  description: string | null;
  venue: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string | null;
  organizerName: string | null;
  logoUrl: string | null;
  logoPublicId: string | null;
  bannerUrl: string | null;
  bannerPublicId: string | null;
  status: EventStatus;
  registrationUrl: string | null;
  qrCodeImageUrl: string | null;
  qrCodePublicId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  attendeeCount: number;
}
