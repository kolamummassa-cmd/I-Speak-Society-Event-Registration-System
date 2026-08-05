import { AppError } from "../../middleware/errorHandler";
import { recordAuditLog } from "../../utils/audit";
import * as attendeeRepository from "../attendees/attendee.repository";
import { toSummary } from "../attendees/attendee.service";
import * as checkinRepository from "./checkin.repository";

// Attendee QR codes encode `${APP_BASE_URL}/checkin/<attendeeId>` (see
// public.service.ts, generateQrDataUrl). Accept either that full URL or a
// bare attendee ID, in case a scanner library hands back just the path or
// someone pastes the ID in manually.
function extractAttendeeId(payload: string): string {
  const match = payload.match(/\/checkin\/([^/?#]+)/);
  return decodeURIComponent(match?.[1] ?? payload.trim());
}

async function performCheckIn(
  eventId: string,
  attendeeId: string,
  method: "QR_SCAN" | "MANUAL",
  checkedInById: string
) {
  const attendee = await attendeeRepository.findById(eventId, attendeeId);
  if (!attendee) throw new AppError(404, "Attendee not found for this event");

  if (attendee.checkedIn) {
    const time = attendee.checkInTime ? attendee.checkInTime.toLocaleTimeString() : null;
    throw new AppError(409, `${attendee.fullName} is already checked in${time ? ` (at ${time})` : ""}.`);
  }

  await checkinRepository.createCheckIn(attendeeId, method, checkedInById);

  await recordAuditLog({
    userId: checkedInById,
    action: "ATTENDEE_CHECKED_IN",
    entityType: "Attendee",
    entityId: attendeeId,
    eventId,
    changes: { method },
  });

  const updated = await attendeeRepository.findById(eventId, attendeeId);
  return toSummary(updated!);
}

export function checkInByScan(eventId: string, payload: string, checkedInById: string) {
  return performCheckIn(eventId, extractAttendeeId(payload), "QR_SCAN", checkedInById);
}

export function checkInManually(eventId: string, attendeeId: string, checkedInById: string) {
  return performCheckIn(eventId, attendeeId, "MANUAL", checkedInById);
}

export async function undoCheckIn(eventId: string, attendeeId: string, userId: string) {
  const attendee = await attendeeRepository.findById(eventId, attendeeId);
  if (!attendee) throw new AppError(404, "Attendee not found for this event");
  if (!attendee.checkedIn) throw new AppError(409, "This attendee is not checked in.");

  await checkinRepository.removeCheckIn(attendeeId);

  await recordAuditLog({
    userId,
    action: "ATTENDEE_CHECKIN_UNDONE",
    entityType: "Attendee",
    entityId: attendeeId,
    eventId,
  });

  const updated = await attendeeRepository.findById(eventId, attendeeId);
  return toSummary(updated!);
}
