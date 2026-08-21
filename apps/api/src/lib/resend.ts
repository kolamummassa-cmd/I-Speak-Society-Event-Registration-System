import { Resend } from "resend";
import { env } from "../config/env";

// Tolerant of a missing API key on purpose: email is a best-effort feature
// (registration confirmations, check-in thank-yous), not a required one.
// Until RESEND_API_KEY is set, this stays null and email.service.ts skips
// sending instead of the whole app failing to start.
export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

if (!resend) {
  console.warn(
    "RESEND_API_KEY is not set - registration/check-in emails will be skipped until it is."
  );
}
