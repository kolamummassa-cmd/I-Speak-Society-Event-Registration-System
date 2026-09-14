import type { ListAttendeesQuery, UpdateAttendeeInput } from "@isociety/shared";
import { Prisma } from "@isociety/database";
import { AppError } from "../../middleware/errorHandler";
import { recordAuditLog } from "../../utils/audit";
import * as attendeeRepository from "./attendee.repository";

export function toSummary(attendee: {
  id: string;
  eventId: string;
  registrationNumber: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  organization: string | null;
  position: string | null;
  checkedIn: boolean;
  checkInTime: Date | null;
  registeredAt: Date;
}) {
  return {
    id: attendee.id,
    eventId: attendee.eventId,
    registrationNumber: attendee.registrationNumber,
    fullName: attendee.fullName,
    phone: attendee.phone,
    email: attendee.email,
    organization: attendee.organization,
    position: attendee.position,
    checkedIn: attendee.checkedIn,
    checkInTime: attendee.checkInTime?.toISOString() ?? null,
    registeredAt: attendee.registeredAt.toISOString(),
  };
}

export async function listAttendees(eventId: string, query: ListAttendeesQuery) {
  const { attendees, total } = await attendeeRepository.findMany(eventId, query);
  return {
    data: attendees.map(toSummary),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function getAttendee(eventId: string, attendeeId: string) {
  const attendee = await attendeeRepository.findById(eventId, attendeeId);
  if (!attendee) throw new AppError(404, "Attendee not found");

  return {
    ...toSummary(attendee),
    gender: attendee.gender,
    country: attendee.country,
    city: attendee.city,
    checkInMethod: attendee.checkInMethod,
    responses: attendee.responses.map((r) => ({
      fieldId: r.fieldId,
      label: r.field.label,
      fieldType: r.field.fieldType,
      value: r.value,
    })),
  };
}

export async function updateAttendee(
  eventId: string,
  attendeeId: string,
  input: UpdateAttendeeInput,
  userId: string
) {
  const existing = await attendeeRepository.findById(eventId, attendeeId);
  if (!existing) throw new AppError(404, "Attendee not found");

  const { responses, ...fields } = input;

  try {
    await attendeeRepository.update(attendeeId, {
      fullName: fields.fullName,
      phone: fields.phone === "" ? null : fields.phone,
      email: fields.email === "" ? null : fields.email,
      organization: fields.organization === "" ? null : fields.organization,
      position: fields.position === "" ? null : fields.position,
      gender: fields.gender === "" ? null : fields.gender,
      country: fields.country === "" ? null : fields.country,
      city: fields.city === "" ? null : fields.city,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new AppError(409, "Another attendee is already registered with that email for this event.");
    }
    throw err;
  }

  if (responses) {
    const entries = Object.entries(responses).map(([fieldId, value]) => ({
      fieldId,
      value: Array.isArray(value) ? JSON.stringify(value) : value,
    }));
    if (entries.length > 0) {
      await attendeeRepository.upsertResponses(attendeeId, entries);
    }
  }

  await recordAuditLog({
    userId,
    action: "ATTENDEE_UPDATED",
    entityType: "Attendee",
    entityId: attendeeId,
    eventId,
    changes: input,
  });

  return getAttendee(eventId, attendeeId);
}

export async function deleteAttendee(eventId: string, attendeeId: string, userId: string) {
  const existing = await attendeeRepository.findById(eventId, attendeeId);
  if (!existing) throw new AppError(404, "Attendee not found");

  await attendeeRepository.remove(attendeeId);

  await recordAuditLog({
    userId,
    action: "ATTENDEE_DELETED",
    entityType: "Attendee",
    entityId: attendeeId,
    eventId,
    changes: { fullName: existing.fullName, registrationNumber: existing.registrationNumber },
  });
}
