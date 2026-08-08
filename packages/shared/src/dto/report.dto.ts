import { z } from "zod";

// Same filters as the attendee list, minus pagination - the export always
// returns every matching row in one file.
export const exportAttendeesQuerySchema = z.object({
  search: z.string().optional(),
  checkedIn: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export type ExportAttendeesQuery = z.infer<typeof exportAttendeesQuerySchema>;
