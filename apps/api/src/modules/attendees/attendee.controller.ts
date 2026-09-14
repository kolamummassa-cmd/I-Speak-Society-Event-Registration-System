import type { Request, Response } from "express";
import type { ListAttendeesQuery } from "@isociety/shared";
import { requireParam } from "../../utils/requireParam";
import * as attendeeService from "./attendee.service";

export async function listAttendeesHandler(req: Request, res: Response) {
  const result = await attendeeService.listAttendees(
    requireParam(req, "id"),
    req.query as unknown as ListAttendeesQuery
  );
  res.status(200).json({ success: true, ...result });
}

export async function getAttendeeHandler(req: Request, res: Response) {
  const attendee = await attendeeService.getAttendee(
    requireParam(req, "id"),
    requireParam(req, "attendeeId")
  );
  res.status(200).json({ success: true, data: { attendee } });
}

export async function updateAttendeeHandler(req: Request, res: Response) {
  const attendee = await attendeeService.updateAttendee(
    requireParam(req, "id"),
    requireParam(req, "attendeeId"),
    req.body,
    req.user!.sub
  );
  res.status(200).json({ success: true, data: { attendee } });
}

export async function deleteAttendeeHandler(req: Request, res: Response) {
  await attendeeService.deleteAttendee(requireParam(req, "id"), requireParam(req, "attendeeId"), req.user!.sub);
  res.status(204).send();
}
