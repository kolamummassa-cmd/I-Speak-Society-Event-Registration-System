import { Router } from "express";
import { scanCheckInSchema } from "@isociety/shared";
import { checkinLimiter } from "../../middleware/rateLimiter";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { scanCheckInHandler } from "./checkin.controller";

// Mounted at /api/events/:id/checkin with mergeParams - authenticate is
// already applied by the parent eventRouter. Manual check-in/undo live on
// attendeeRouter instead (/api/events/:id/attendees/:attendeeId/checkin)
// since they're keyed off an attendee, not a scanned payload.
export const checkinRouter = Router({ mergeParams: true });

checkinRouter.post(
  "/scan",
  checkinLimiter,
  validateBody(scanCheckInSchema),
  asyncHandler(scanCheckInHandler)
);
