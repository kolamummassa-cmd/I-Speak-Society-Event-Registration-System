import dayjs from "dayjs";
import PDFDocument from "pdfkit";

// A hand-rolled table renderer instead of pdfkit's newer built-in `.table()`
// API - that API landed recently, is thinly documented, and its
// page-break/header-repeat behavior isn't something we can verify without
// deeper testing. Drawing rows ourselves is more code but fully predictable:
// exact A4 layout, guaranteed header repetition on every page.

export interface PdfReportField {
  id: string;
  label: string;
}

export interface PdfReportRow {
  registrationNumber: string;
  checkedIn: boolean;
  checkInTime: Date | null;
  values: Record<string, string>; // fieldId -> display value
}

export interface PdfReportInput {
  eventName: string;
  eventDate: Date;
  startTime: Date;
  endTime: Date;
  venue: string | null;
  fields: PdfReportField[];
  rows: PdfReportRow[];
}

const MARGIN = 36;
const HEADER_ROW_HEIGHT = 22;
const BODY_ROW_HEIGHT = 20;
const CELL_PADDING = 4;
const HEADER_FILL = "#1D4ED8";
const STRIPE_FILL = "#F3F4F6";
const BORDER_COLOR = "#E5E7EB";

interface Column {
  label: string;
  width: number;
  render: (row: PdfReportRow, index: number) => string;
}

function buildColumns(fields: PdfReportField[], usableWidth: number): Column[] {
  const fixed: Column[] = [
    { label: "#", width: 26, render: (_row, i) => String(i + 1) },
    { label: "Reg. Number", width: 78, render: (row) => row.registrationNumber },
  ];
  const trailing: Column[] = [
    { label: "Checked In", width: 58, render: (row) => (row.checkedIn ? "Yes" : "No") },
    {
      label: "Check-in Time",
      width: 72,
      render: (row) => (row.checkInTime ? dayjs(row.checkInTime).format("MMM D, h:mm A") : ""),
    },
  ];

  const fixedWidth =
    fixed.reduce((sum, c) => sum + c.width, 0) + trailing.reduce((sum, c) => sum + c.width, 0);
  const remaining = Math.max(usableWidth - fixedWidth, fields.length * 50);
  const dynamicWidth = fields.length > 0 ? remaining / fields.length : 0;

  const dynamic: Column[] = fields.map((field) => ({
    label: field.label,
    width: dynamicWidth,
    render: (row) => row.values[field.id] ?? "",
  }));

  return [...fixed, ...dynamic, ...trailing];
}

function truncate(doc: PDFKit.PDFDocument, text: string, maxWidth: number): string {
  if (doc.widthOfString(text) <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && doc.widthOfString(`${result}…`) > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}…`;
}

function drawHeaderRow(doc: PDFKit.PDFDocument, columns: Column[], y: number): number {
  const totalWidth = columns.reduce((sum, c) => sum + c.width, 0);
  doc.rect(MARGIN, y, totalWidth, HEADER_ROW_HEIGHT).fill(HEADER_FILL);
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#FFFFFF");
  let x = MARGIN;
  for (const col of columns) {
    doc.text(truncate(doc, col.label, col.width - CELL_PADDING * 2), x + CELL_PADDING, y + 7, {
      width: col.width - CELL_PADDING * 2,
      lineBreak: false,
    });
    x += col.width;
  }
  return y + HEADER_ROW_HEIGHT;
}

function drawBodyRow(
  doc: PDFKit.PDFDocument,
  columns: Column[],
  row: PdfReportRow,
  index: number,
  y: number
): number {
  const totalWidth = columns.reduce((sum, c) => sum + c.width, 0);
  if (index % 2 === 1) {
    doc.rect(MARGIN, y, totalWidth, BODY_ROW_HEIGHT).fill(STRIPE_FILL);
  }
  doc.font("Helvetica").fontSize(8).fillColor("#111827");
  let x = MARGIN;
  for (const col of columns) {
    const text = truncate(doc, col.render(row, index), col.width - CELL_PADDING * 2);
    doc.text(text, x + CELL_PADDING, y + 6, {
      width: col.width - CELL_PADDING * 2,
      lineBreak: false,
    });
    x += col.width;
  }
  doc
    .strokeColor(BORDER_COLOR)
    .lineWidth(0.5)
    .moveTo(MARGIN, y + BODY_ROW_HEIGHT)
    .lineTo(MARGIN + totalWidth, y + BODY_ROW_HEIGHT)
    .stroke();
  return y + BODY_ROW_HEIGHT;
}

export function renderAttendeeReportPdf(input: PdfReportInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Wide attendee sheets (lots of visible fields) read better landscape.
    const useLandscape = input.fields.length > 6;
    const doc = new PDFDocument({
      size: "A4",
      layout: useLandscape ? "landscape" : "portrait",
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const usableWidth = doc.page.width - MARGIN * 2;

    // --- Event info header ---
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#111827")
      .text(input.eventName, { width: usableWidth });
    doc.moveDown(0.3);

    const dateLine = `${dayjs(input.eventDate).format("MMMM D, YYYY")}  ·  ${dayjs(
      input.startTime
    ).format("h:mm A")} - ${dayjs(input.endTime).format("h:mm A")}`;
    doc.font("Helvetica").fontSize(10).fillColor("#4B5563").text(dateLine, { width: usableWidth });
    if (input.venue) doc.text(input.venue, { width: usableWidth });

    doc.moveDown(0.6);
    const checkedInCount = input.rows.filter((r) => r.checkedIn).length;
    const rate = input.rows.length > 0 ? Math.round((checkedInCount / input.rows.length) * 100) : 0;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#111827")
      .text(`Total registered: ${input.rows.length}    Checked in: ${checkedInCount} (${rate}%)`, {
        width: usableWidth,
      });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text(`Generated ${dayjs().format("MMMM D, YYYY h:mm A")}`, { width: usableWidth });

    doc.moveDown(0.5);
    doc
      .strokeColor(BORDER_COLOR)
      .lineWidth(1)
      .moveTo(MARGIN, doc.y)
      .lineTo(MARGIN + usableWidth, doc.y)
      .stroke();
    doc.moveDown(0.6);

    // --- Attendee sheet ---
    const columns = buildColumns(input.fields, usableWidth);
    let y = drawHeaderRow(doc, columns, doc.y);

    const bottomLimit = doc.page.height - MARGIN;
    input.rows.forEach((row, index) => {
      if (y + BODY_ROW_HEIGHT > bottomLimit) {
        doc.addPage();
        y = drawHeaderRow(doc, columns, MARGIN);
      }
      y = drawBodyRow(doc, columns, row, index, y);
    });

    if (input.rows.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#6B7280")
        .text("No attendees match this filter.", MARGIN, y + 8);
    }

    doc.end();
  });
}
