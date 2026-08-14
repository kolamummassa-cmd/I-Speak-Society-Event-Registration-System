import { z } from "zod";

export const eventStatusSchema = z.enum(["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"]);

// eventDate/registrationDeadline come from a plain <input type="date">
// ("YYYY-MM-DD", no time component) - JS's Date parser treats a bare date
// string like that as UTC MIDNIGHT, unlike a datetime-local string (which
// it parses as local time). That inconsistency means the calendar date can
// silently shift by a day once it round-trips through any timezone-aware
// display, depending on the viewer's local UTC offset. Anchoring it to
// midday UTC instead of midnight keeps the same calendar date intact for
// every real-world timezone (UTC-12 through UTC+14), so this is applied
// before coercing to a Date at all.
const dateOnlySchema = z.preprocess((value) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T12:00:00`;
  }
  return value;
}, z.coerce.date());

// Base shape shared by create and update - kept as a plain ZodObject (no
// .refine() yet) so both variants below can call .partial() on it, which
// only exists on ZodObject, not on the ZodEffects a .refine() would produce.
const eventBaseSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200),
  description: z.string().max(2000).optional(),
  venue: z.string().max(200).optional(),
  eventDate: dateOnlySchema,
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  registrationDeadline: dateOnlySchema.optional(),
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
