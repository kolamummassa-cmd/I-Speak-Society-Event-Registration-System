import type { FieldType } from "./form";

export type CheckInMethod = "QR_SCAN" | "MANUAL";

export interface AttendeeSummary {
  id: string;
  eventId: string;
  registrationNumber: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  organization: string | null;
  position: string | null;
  checkedIn: boolean;
  checkInTime: string | null;
  registeredAt: string;
}

export interface AttendeeResponseItem {
  fieldId: string;
  label: string;
  fieldType: FieldType;
  value: string;
}

export interface AttendeeDetail extends AttendeeSummary {
  gender: string | null;
  country: string | null;
  city: string | null;
  checkInMethod: CheckInMethod | null;
  responses: AttendeeResponseItem[];
}
