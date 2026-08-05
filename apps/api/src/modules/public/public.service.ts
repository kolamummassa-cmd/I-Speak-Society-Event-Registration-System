import dayjs from "dayjs";
import QRCode from "qrcode";
import { Prisma, prisma } from "@isociety/database";
import type { PublicEventInfo, RegisterAttendeeInput } from "@isociety/shared";
import { AppError } from "../../middleware/errorHandler";
import { recordAuditLog } from "../../utils/audit";
import { generateRegistrationNumber } from "../../utils/registrationNumber";
import { DEFAULT_FIELD_COLUMNS } from "../../utils/defaultFieldColumns";

const formInclude = {
  fields: {
    orderBy: { displayOrder: "asc" as const },
    include: { options: { orderBy: { displayOrder: "asc" as const } } },
  },
};

function toPublicEvent(event: {
  id: string;
  name: string;
  description: string | null;
  venue: string | null;
  eventDate: Date;
  startTime: Date;
  endTime: Date;
  organizerName: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: string;
  registrationDeadline: Date | null;
}): PublicEventInfo {
  let registrationOpen = event.status === "PUBLISHED";
  let closedReason: string | null = registrationOpen ? null : "This event is not open for registration.";

  if (registrationOpen && event.registrationDeadline && dayjs().isAfter(event.registrationDeadline)) {
    registrationOpen = false;
    closedReason = "The registration deadline for this event has passed.";
  }

  return {
    id: event.id,
    name: event.name,
    description: event.description,
    venue: event.venue,
    eventDate: event.eventDate.toISOString(),
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    organizerName: event.organizerName,
    logoUrl: event.logoUrl,
    bannerUrl: event.bannerUrl,
    registrationOpen,
    closedReason,
  };
}

async function loadEventAndForm(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(404, "Event not found");

  const form = await prisma.registrationForm.findUnique({
    where: { eventId },
    include: formInclude,
  });
  if (!form) throw new AppError(404, "Registration form not found for this event");

  return { event, form };
}

export async function getPublicEvent(eventId: string) {
  const { event, form } = await loadEventAndForm(eventId);
  return { event: toPublicEvent(event), form };
}

function buildAttendeeQrPayload(attendeeId: string, baseUrl: string): string {
  // Encodes the same base URL scheme as event QR codes, but under /checkin/
  // so Phase 9's scanner can tell "this is an attendee code" from "this is
  // an event registration link" at a glance if ever needed. `baseUrl` comes
  // from the triggering request's Origin (see utils/resolveAppBaseUrl.ts).
  return `${baseUrl}/checkin/${attendeeId}`;
}

async function generateQrDataUrl(attendeeId: string, baseUrl: string): Promise<string> {
  return QRCode.toDataURL(buildAttendeeQrPayload(attendeeId, baseUrl), { width: 320, margin: 2 });
}

export async function registerAttendee(
  eventId: string,
  input: RegisterAttendeeInput,
  baseUrl: string
) {
  const { event, form } = await loadEventAndForm(eventId);
  const publicEvent = toPublicEvent(event);

  if (!publicEvent.registrationOpen) {
    throw new AppError(400, publicEvent.closedReason ?? "Registration is closed for this event");
  }

  const fieldErrors: Record<string, string> = {};
  const attendeeColumns: Record<string, string> = {};
  const customResponses: { fieldId: string; value: string }[] = [];

  const fieldsByKey = new Map(form.fields.map((f) => [f.isDefaultField ? f.fieldKey : f.id, f]));

  for (const field of form.fields) {
    // Full name is a hard requirement at the database level (Attendee.fullName
    // is NOT NULL) regardless of the organizer's visibility toggle - treat it
    // as always active.
    const isForced = field.fieldKey === "full_name";
    if (!field.isVisible && !isForced) continue;

    // Conditional fields: only validate/store if their condition is met.
    if (field.conditionFieldId) {
      const conditionField = form.fields.find((f) => f.id === field.conditionFieldId);
      const conditionKey = conditionField
        ? conditionField.isDefaultField
          ? conditionField.fieldKey
          : conditionField.id
        : null;
      const conditionActual = conditionKey ? input.responses[conditionKey] : undefined;
      if (conditionActual !== field.conditionValue) continue;
    }

    const key = field.isDefaultField ? field.fieldKey : field.id;
    const raw = input.responses[key];
    const isEmpty = raw === undefined || raw === "" || (Array.isArray(raw) && raw.length === 0);

    if ((field.isRequired || isForced) && isEmpty) {
      fieldErrors[key] = `${field.label} is required`;
      continue;
    }
    if (isEmpty) continue;

    if (field.fieldType === "EMAIL" && typeof raw === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      fieldErrors[key] = "Enter a valid email address";
      continue;
    }
    if (field.fieldType === "NUMBER" && typeof raw === "string" && Number.isNaN(Number(raw))) {
      fieldErrors[key] = "Enter a valid number";
      continue;
    }

    const storedValue = Array.isArray(raw) ? JSON.stringify(raw) : raw;

    if (field.isDefaultField) {
      const column = DEFAULT_FIELD_COLUMNS[field.fieldKey];
      if (column) attendeeColumns[column] = storedValue;
    } else {
      customResponses.push({ fieldId: field.id, value: storedValue });
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError(400, "Validation failed", fieldErrors);
  }
  if (!attendeeColumns.fullName) {
    throw new AppError(400, "Validation failed", { full_name: "Full Name is required" });
  }

  let attendee;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      attendee = await prisma.attendee.create({
        data: {
          event: { connect: { id: eventId } },
          registrationNumber: generateRegistrationNumber(),
          fullName: attendeeColumns.fullName,
          phone: attendeeColumns.phone ?? null,
          email: attendeeColumns.email ?? null,
          organization: attendeeColumns.organization ?? null,
          position: attendeeColumns.position ?? null,
          gender: attendeeColumns.gender ?? null,
          country: attendeeColumns.country ?? null,
          city: attendeeColumns.city ?? null,
          responses: { create: customResponses },
        },
      });
      break;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = (err.meta?.target as string[] | undefined) ?? [];
        if (target.includes("registrationNumber")) continue; // astronomically rare - retry with a new one
        if (target.includes("email") || target.includes("eventId")) {
          throw new AppError(409, "You've already registered for this event with that email address.");
        }
      }
      throw err;
    }
  }
  if (!attendee) {
    throw new AppError(500, "Could not complete registration. Try again.");
  }

  await recordAuditLog({
    // no userId - this is a guest action, not an organizer one
    action: "ATTENDEE_REGISTERED",
    entityType: "Attendee",
    entityId: attendee.id,
    eventId,
  });

  return {
    attendee: {
      id: attendee.id,
      registrationNumber: attendee.registrationNumber,
      fullName: attendee.fullName,
    },
    event: publicEvent,
    qrCodeDataUrl: await generateQrDataUrl(attendee.id, baseUrl),
  };
}

export async function getRegistration(attendeeId: string, baseUrl: string) {
  const attendee = await prisma.attendee.findUnique({ where: { id: attendeeId } });
  if (!attendee) throw new AppError(404, "Registration not found");

  const event = await prisma.event.findUnique({ where: { id: attendee.eventId } });
  if (!event) throw new AppError(404, "Event not found");

  return {
    attendee: {
      id: attendee.id,
      registrationNumber: attendee.registrationNumber,
      fullName: attendee.fullName,
    },
    event: toPublicEvent(event),
    qrCodeDataUrl: await generateQrDataUrl(attendee.id, baseUrl),
  };
}
