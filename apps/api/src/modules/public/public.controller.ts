import type { Request, Response } from "express";
import { requireParam } from "../../utils/requireParam";
import * as publicService from "./public.service";

export async function getPublicEventHandler(req: Request, res: Response) {
  const result = await publicService.getPublicEvent(requireParam(req, "eventId"));
  res.status(200).json({ success: true, data: result });
}

export async function registerAttendeeHandler(req: Request, res: Response) {
  const result = await publicService.registerAttendee(requireParam(req, "eventId"), req.body);
  res.status(201).json({ success: true, data: result });
}

export async function getRegistrationHandler(req: Request, res: Response) {
  const result = await publicService.getRegistration(requireParam(req, "attendeeId"));
  res.status(200).json({ success: true, data: result });
}
