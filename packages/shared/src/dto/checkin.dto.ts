import { z } from "zod";

export const scanCheckInSchema = z.object({
  payload: z.string().min(1, "QR payload is required"),
});

export type ScanCheckInInput = z.infer<typeof scanCheckInSchema>;
