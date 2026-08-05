import { Router } from "express";
import { listAttendeesQuerySchema, updateAttendeeSchema } from "@isociety/shared";
import { validateBody, validateQuery } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  deleteAttendeeHandler,
  getAttendeeHandler,
  listAttendeesHandler,
  updateAttendeeHandler,
} from "./attendee.controller";

// Mounted at /api/events/:id/attendees with mergeParams - authenticate is
// already applied by the parent eventRouter.
export const attendeeRouter = Router({ mergeParams: true });

attendeeRouter.get("/", validateQuery(listAttendeesQuerySchema), asyncHandler(listAttendeesHandler));
attendeeRouter.get("/:attendeeId", asyncHandler(getAttendeeHandler));
attendeeRouter.patch(
  "/:attendeeId",
  validateBody(updateAttendeeSchema),
  asyncHandler(updateAttendeeHandler)
);
attendeeRouter.delete("/:attendeeId", asyncHandler(deleteAttendeeHandler));
