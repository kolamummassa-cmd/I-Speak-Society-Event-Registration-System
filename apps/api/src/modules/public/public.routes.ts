import { Router } from "express";
import rateLimit from "express-rate-limit";
import { registerAttendeeSchema } from "@isociety/shared";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  getPublicEventHandler,
  getRegistrationHandler,
  registerAttendeeHandler,
} from "./public.controller";

// Unauthenticated by design - guests never log in. Kept as its own router
// (mounted at /api/public in app.ts) so it's obvious at a glance which
// endpoints are reachable without a session.
export const publicRouter = Router();

// Registration is the one write endpoint anyone on the internet can hit
// without logging in, so it gets its own stricter limiter - generous enough
// for a real rush of attendees at an event, tight enough to blunt spam.
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many registration attempts. Try again shortly." },
});

publicRouter.get("/events/:eventId", asyncHandler(getPublicEventHandler));
publicRouter.post(
  "/events/:eventId/register",
  registerLimiter,
  validateBody(registerAttendeeSchema),
  asyncHandler(registerAttendeeHandler)
);
publicRouter.get("/registrations/:attendeeId", asyncHandler(getRegistrationHandler));
