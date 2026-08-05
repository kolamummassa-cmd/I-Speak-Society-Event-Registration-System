import { Router } from "express";
import { exportAttendeesQuerySchema } from "@isociety/shared";
import { validateQuery } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { exportAttendeesHandler, exportAttendeesPdfHandler } from "./report.controller";

// Mounted at /api/events/:id/reports with mergeParams - authenticate is
// already applied by the parent eventRouter.
export const reportRouter = Router({ mergeParams: true });

reportRouter.get(
  "/attendees.xlsx",
  validateQuery(exportAttendeesQuerySchema),
  asyncHandler(exportAttendeesHandler)
);
reportRouter.get(
  "/attendees.pdf",
  validateQuery(exportAttendeesQuerySchema),
  asyncHandler(exportAttendeesPdfHandler)
);
