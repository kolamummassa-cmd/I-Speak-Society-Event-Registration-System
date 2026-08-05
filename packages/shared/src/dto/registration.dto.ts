import { z } from "zod";

// Keyed by fieldKey for default fields (e.g. "full_name") or fieldId for
// custom fields - the server resolves which is which using the event's
// actual form definition. Checkbox fields submit an array of selected
// values; everything else submits a single string.
export const registerAttendeeSchema = z.object({
  responses: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

export type RegisterAttendeeInput = z.infer<typeof registerAttendeeSchema>;
