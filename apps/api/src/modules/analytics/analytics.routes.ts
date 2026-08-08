import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { getEventAnalyticsHandler } from "./analytics.controller";

// Mounted at /api/events/:id/analytics with mergeParams - authenticate is
// already applied by the parent eventRouter.
export const analyticsRouter = Router({ mergeParams: true });

analyticsRouter.get("/", asyncHandler(getEventAnalyticsHandler));
