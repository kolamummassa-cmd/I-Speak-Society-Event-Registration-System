import type { Request, Response } from "express";
import { requireParam } from "../../utils/requireParam";
import * as checkinService from "./checkin.service";

export async function scanCheckInHandler(req: Request, res: Response) {
  const attendee = await checkinService.checkInByScan(
    requireParam(req, "id"),
    req.body.payload,
    req.user!.sub
  );
  res.status(200).json({ success: true, data: { attendee } });
}

export async function manualCheckInHandler(req: Request, res: Response) {
  const attendee = await checkinService.checkInManually(
    requireParam(req, "id"),
    requireParam(req, "attendeeId"),
    req.user!.sub
  );
  res.status(200).json({ success: true, data: { attendee } });
}

export async function undoCheckInHandler(req: Request, res: Response) {
  const attendee = await checkinService.undoCheckIn(
    requireParam(req, "id"),
    requireParam(req, "attendeeId"),
    req.user!.sub
  );
  res.status(200).json({ success: true, data: { attendee } });
}
