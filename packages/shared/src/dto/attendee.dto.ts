import { z } from "zod";

export const listAttendeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  checkedIn: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export type ListAttendeesQuery = z.infer<typeof listAttendeesQuerySchema>;

export const updateAttendeeSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  organization: z.string().max(200).optional().or(z.literal("")),
  position: z.string().max(200).optional().or(z.literal("")),
  gender: z.string().max(50).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  responses: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
});

export type UpdateAttendeeInput = z.infer<typeof updateAttendeeSchema>;
