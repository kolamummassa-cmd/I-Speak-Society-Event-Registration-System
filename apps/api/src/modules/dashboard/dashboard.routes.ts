import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { asyncHandler } from "../../utils/asyncHandler";
import { getDashboardOverviewHandler } from "./dashboard.controller";

// Mounted directly at /api/dashboard in app.ts - this is cross-event/global,
// unlike analytics (per-event, nested under eventRouter), so it applies its
// own authenticate rather than inheriting one.
export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get("/overview", asyncHandler(getDashboardOverviewHandler));
