import type { Request, Response } from "express";
import * as dashboardService from "./dashboard.service";

export async function getDashboardOverviewHandler(_req: Request, res: Response) {
  const overview = await dashboardService.getDashboardOverview();
  res.status(200).json({ success: true, data: { overview } });
}
