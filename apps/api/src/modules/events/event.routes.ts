import { Router } from "express";
import { createEventSchema, listEventsQuerySchema, updateEventSchema } from "@isociety/shared";
import { authenticate } from "../../middleware/authenticate";
import { validateBody, validateQuery } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createEventHandler,
  deleteEventHandler,
  getEventHandler,
  listEventsHandler,
  updateEventHandler,
} from "./event.controller";

export const eventRouter = Router();

// Every event route requires an authenticated organizer - there is no
// public read access to this router (public registration gets its own
// route in Phase 7, scoped to a single event by its registration link).
eventRouter.use(authenticate);

eventRouter.get("/", validateQuery(listEventsQuerySchema), asyncHandler(listEventsHandler));
eventRouter.get("/:id", asyncHandler(getEventHandler));
eventRouter.post("/", validateBody(createEventSchema), asyncHandler(createEventHandler));
eventRouter.patch("/:id", validateBody(updateEventSchema), asyncHandler(updateEventHandler));
eventRouter.delete("/:id", asyncHandler(deleteEventHandler));
