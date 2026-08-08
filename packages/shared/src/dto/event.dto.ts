import { z } from "zod";

export const eventStatusSchema = z.enum(["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"]);

// Base shape shared by create and update - kept as a plain ZodObject (no
// .refine() yet) so both variants below can call .partial() on it, which
// only exists on ZodObject, not on the ZodEffects a .refine() would produce.
const eventBaseSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200),
  description: z.string().max(2000).optional(),
  venue: z.string().max(200).optional(),
  eventDate: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  registrationDeadline: z.coerce.date().optional(),
  organizerName: z.string().max(200).optional(),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  logoPublicId: z.string().optional().or(z.literal("")),
  bannerUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  bannerPublicId: z.string().optional().or(z.literal("")),
  status: eventStatusSchema.optional(),
});

function withEndAfterStart<T extends { startTime?: Date; endTime?: Date }>(data: T) {
  return !data.startTime || !data.endTime || data.endTime > data.startTime;
}

export const createEventSchema = eventBaseSchema.refine(withEndAfterStart, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

// Partial update - every field optional, but if both times are provided
// together the same end-after-start rule still applies.
export const updateEventSchema = eventBaseSchema.partial().refine(withEndAfterStart, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: eventStatusSchema.optional(),
});

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
