import ExcelJS from "exceljs";
import type { ExportAttendeesQuery } from "@isociety/shared";
import { AppError } from "../../middleware/errorHandler";
import { recordAuditLog } from "../../utils/audit";
import { DEFAULT_FIELD_COLUMNS } from "../../utils/defaultFieldColumns";
import * as attendeeRepository from "../attendees/attendee.repository";
import * as eventRepository from "../events/event.repository";
import * as formRepository from "../forms/form.repository";
import { renderAttendeeReportPdf, type PdfReportRow } from "./report.pdf";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1D4ED8" },
};

// Checkbox/multi-select responses are stored as a JSON-encoded array (see
// attendee.service.ts's updateAttendee) - unwrap that back into a
// comma-separated cell value. Anything else is already a plain string.
function decodeResponseValue(value: string): string {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join(", ") : value;
  } catch {
    return value;
  }
}

function buildFilename(eventName: string, extension: "xlsx" | "pdf"): string {
  const slug = eventName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `${slug || "event"}-attendees-${date}.${extension}`;
}

export async function generateAttendeeReport(
  eventId: string,
  filters: ExportAttendeesQuery,
  userId: string
) {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError(404, "Event not found");

  const form = await formRepository.findByEventId(eventId);
  const customFields = (form?.fields ?? [])
    .filter((f) => !f.isDefaultField)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const attendees = await attendeeRepository.findAllForExport(eventId, filters);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "I Speak Society";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Attendees", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const baseColumns = [
    { header: "Registration Number", key: "registrationNumber", width: 22 },
    { header: "Full Name", key: "fullName", width: 28 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Organization", key: "organization", width: 24 },
    { header: "Position", key: "position", width: 20 },
    { header: "Gender", key: "gender", width: 12 },
    { header: "Country", key: "country", width: 16 },
    { header: "City", key: "city", width: 16 },
    { header: "Checked In", key: "checkedIn", width: 12 },
    { header: "Check-in Time", key: "checkInTime", width: 20 },
    { header: "Check-in Method", key: "checkInMethod", width: 16 },
    { header: "Registered At", key: "registeredAt", width: 20 },
  ];
  const customColumns = customFields.map((f) => ({ header: f.label, key: f.id, width: 22 }));
  sheet.columns = [...baseColumns, ...customColumns];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle" };
  });

  for (const attendee of attendees) {
    const responseByField = new Map(
      attendee.responses.map((r) => [r.fieldId, decodeResponseValue(r.value)])
    );
    const row: Record<string, string | number | Date | null> = {
      registrationNumber: attendee.registrationNumber,
      fullName: attendee.fullName,
      phone: attendee.phone,
      email: attendee.email,
      organization: attendee.organization,
      position: attendee.position,
      gender: attendee.gender,
      country: attendee.country,
      city: attendee.city,
      checkedIn: attendee.checkedIn ? "Yes" : "No",
      checkInTime: attendee.checkInTime,
      checkInMethod: attendee.checkInMethod,
      registeredAt: attendee.registeredAt,
    };
    for (const field of customFields) {
      row[field.id] = responseByField.get(field.id) ?? "";
    }
    sheet.addRow(row);
  }

  sheet.getColumn("checkInTime").numFmt = "yyyy-mm-dd hh:mm";
  sheet.getColumn("registeredAt").numFmt = "yyyy-mm-dd hh:mm";

  const summary = workbook.addWorksheet("Summary");
  const checkedInCount = attendees.filter((a) => a.checkedIn).length;
  const rate = attendees.length > 0 ? Math.round((checkedInCount / attendees.length) * 100) : 0;
  summary.addRows([
    ["Event", event.name],
    ["Date", event.eventDate.toISOString().slice(0, 10)],
    ["Venue", event.venue ?? "-"],
    [],
    ["Total attendees (this export)", attendees.length],
    ["Checked in", checkedInCount],
    ["Check-in rate", `${rate}%`],
    ["Generated at", new Date().toISOString()],
  ]);
  summary.getColumn(1).font = { bold: true };
  summary.getColumn(1).width = 30;
  summary.getColumn(2).width = 30;

  await recordAuditLog({
    userId,
    action: "ATTENDEES_EXPORTED",
    entityType: "Event",
    entityId: eventId,
    eventId,
    changes: { count: attendees.length, filters },
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, filename: buildFilename(event.name, "xlsx") };
}

// Only fields the organizer has actually made visible on the registration
// form appear as columns here - default fields (Full Name, Email, ...) are
// included only if visible, and read from their real Attendee column;
// custom fields are read from AttendeeResponse. Nothing is hardcoded.
export async function generateAttendeePdfReport(
  eventId: string,
  filters: ExportAttendeesQuery,
  userId: string
) {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError(404, "Event not found");

  const form = await formRepository.findByEventId(eventId);
  const visibleFields = (form?.fields ?? [])
    .filter((f) => f.isVisible)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const attendees = await attendeeRepository.findAllForExport(eventId, filters);

  const rows: PdfReportRow[] = attendees.map((attendee) => {
    const responseByField = new Map(
      attendee.responses.map((r) => [r.fieldId, decodeResponseValue(r.value)])
    );
    const values: Record<string, string> = {};
    for (const field of visibleFields) {
      if (field.isDefaultField) {
        const column = DEFAULT_FIELD_COLUMNS[field.fieldKey];
        const raw = column ? (attendee as unknown as Record<string, unknown>)[column] : undefined;
        values[field.id] = typeof raw === "string" ? raw : "";
      } else {
        values[field.id] = responseByField.get(field.id) ?? "";
      }
    }
    return {
      registrationNumber: attendee.registrationNumber,
      checkedIn: attendee.checkedIn,
      checkInTime: attendee.checkInTime,
      values,
    };
  });

  const buffer = await renderAttendeeReportPdf({
    eventName: event.name,
    eventDate: event.eventDate,
    startTime: event.startTime,
    endTime: event.endTime,
    venue: event.venue,
    fields: visibleFields.map((f) => ({ id: f.id, label: f.label })),
    rows,
  });

  await recordAuditLog({
    userId,
    action: "ATTENDEES_REPORT_EXPORTED",
    entityType: "Event",
    entityId: eventId,
    eventId,
    changes: { count: attendees.length, filters },
  });

  return { buffer, filename: buildFilename(event.name, "pdf") };
}
