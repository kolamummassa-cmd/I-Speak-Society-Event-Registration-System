import type { Request, Response } from "express";
import type { ListEventsQuery } from "@isociety/shared";
import { requireParam } from "../../utils/requireParam";
import * as eventService from "./event.service";

export async function listEventsHandler(req: Request, res: Response) {
  // Already validated and coerced by the validateQuery middleware.
  const result = await eventService.listEvents(req.query as unknown as ListEventsQuery);
  res.status(200).json({ success: true, ...result });
}

export async function getEventHandler(req: Request, res: Response) {
  const event = await eventService.getEvent(requireParam(req, "id"));
  res.status(200).json({ success: true, data: { event } });
}

export async function createEventHandler(req: Request, res: Response) {
  const event = await eventService.createEvent(req.body, req.user!.sub);
  res.status(201).json({ success: true, data: { event } });
}

export async function updateEventHandler(req: Request, res: Response) {
  const event = await eventService.updateEvent(requireParam(req, "id"), req.body, req.user!.sub);
  res.status(200).json({ success: true, data: { event } });
}

export async function deleteEventHandler(req: Request, res: Response) {
  await eventService.deleteEvent(requireParam(req, "id"), req.user!.sub);
  res.status(204).send();
}

export async function regenerateQrCodeHandler(req: Request, res: Response) {
  const event = await eventService.regenerateQrCode(requireParam(req, "id"), req.user!.sub);
  res.status(200).json({ success: true, data: { event } });
}
