import type { Request, Response } from "express";
import { requireParam } from "../../utils/requireParam";
import * as analyticsService from "./analytics.service";

export async function getEventAnalyticsHandler(req: Request, res: Response) {
  const analytics = await analyticsService.getEventAnalytics(requireParam(req, "id"));
  res.status(200).json({ success: true, data: { analytics } });
}
