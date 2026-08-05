import type { CreateEventInput, ListEventsQuery, UpdateEventInput } from "@isociety/shared";
import { AppError } from "../../middleware/errorHandler";
import { deleteImage } from "../uploads/upload.service";
import { recordAuditLog } from "../../utils/audit";
import * as eventRepository from "./event.repository";

function toSummary(event: Awaited<ReturnType<typeof eventRepository.findById>>) {
  if (!event) return null;
  const { _count, ...rest } = event;
  return { ...rest, attendeeCount: _count.attendees };
}

export async function listEvents(query: ListEventsQuery) {
  const { events, total } = await eventRepository.findMany(query);
  return {
    data: events.map((e) => toSummary(e)),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function getEvent(id: string) {
  const event = await eventRepository.findById(id);
  if (!event) throw new AppError(404, "Event not found");
  return toSummary(event);
}

export async function createEvent(input: CreateEventInput, userId: string) {
  const event = await eventRepository.create({
    ...input,
    logoUrl: input.logoUrl || null,
    logoPublicId: input.logoPublicId || null,
    bannerUrl: input.bannerUrl || null,
    bannerPublicId: input.bannerPublicId || null,
    createdBy: { connect: { id: userId } },
  });

  await recordAuditLog({
    userId,
    action: "EVENT_CREATED",
    entityType: "Event",
    entityId: event.id,
    eventId: event.id,
    changes: input,
  });

  return toSummary(event);
}

export async function updateEvent(id: string, input: UpdateEventInput, userId: string) {
  const existing = await eventRepository.findById(id);
  if (!existing) throw new AppError(404, "Event not found");

  const nextLogoPublicId = input.logoPublicId === "" ? null : input.logoPublicId;
  const nextBannerPublicId = input.bannerPublicId === "" ? null : input.bannerPublicId;

  const event = await eventRepository.update(id, {
    ...input,
    logoUrl: input.logoUrl === "" ? null : input.logoUrl,
    logoPublicId: nextLogoPublicId,
    bannerUrl: input.bannerUrl === "" ? null : input.bannerUrl,
    bannerPublicId: nextBannerPublicId,
  });

  // Clean up the old Cloudinary asset whenever an image field was actually
  // changed (replaced or removed). Checking `!== undefined` rather than the
  // `in` operator is deliberate: it's the value, not key presence, that
  // reliably distinguishes "omitted - leave it alone" (the frontend leaves
  // this key out entirely while a new file is mid-upload) from "included -
  // apply this" (even when the included value is the empty-string removal
  // signal), regardless of how the validator represents an absent optional
  // field internally.
  if (
    nextLogoPublicId !== undefined &&
    existing.logoPublicId &&
    existing.logoPublicId !== nextLogoPublicId
  ) {
    await deleteImage(existing.logoPublicId);
  }
  if (
    nextBannerPublicId !== undefined &&
    existing.bannerPublicId &&
    existing.bannerPublicId !== nextBannerPublicId
  ) {
    await deleteImage(existing.bannerPublicId);
  }

  await recordAuditLog({
    userId,
    action: "EVENT_UPDATED",
    entityType: "Event",
    entityId: event.id,
    eventId: event.id,
    changes: input,
  });

  return toSummary(event);
}

export async function deleteEvent(id: string, userId: string) {
  const existing = await eventRepository.findById(id);
  if (!existing) throw new AppError(404, "Event not found");

  await eventRepository.remove(id);
  await Promise.all([deleteImage(existing.logoPublicId), deleteImage(existing.bannerPublicId)]);

  await recordAuditLog({
    userId,
    action: "EVENT_DELETED",
    entityType: "Event",
    entityId: id,
    changes: { name: existing.name },
  });
}
