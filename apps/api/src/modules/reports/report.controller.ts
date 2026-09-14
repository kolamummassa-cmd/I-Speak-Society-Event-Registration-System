import type { Request, Response } from "express";
import type { ExportAttendeesQuery } from "@isociety/shared";
import { requireParam } from "../../utils/requireParam";
import * as reportService from "./report.service";

export async function exportAttendeesHandler(req: Request, res: Response) {
  const { buffer, filename } = await reportService.generateAttendeeReport(
    requireParam(req, "id"),
    req.query as unknown as ExportAttendeesQuery,
    req.user!.sub
  );

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
}

export async function exportAttendeesPdfHandler(req: Request, res: Response) {
  const { buffer, filename } = await reportService.generateAttendeePdfReport(
    requireParam(req, "id"),
    req.query as unknown as ExportAttendeesQuery,
    req.user!.sub
  );

  // inline (not "attachment") so it opens straight in the browser's PDF
  // viewer, which has its own Print button - the same download still works
  // via the viewer's save/download action, and it's just as shareable as a
  // file saved directly to disk.
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.send(buffer);
}
