import dayjs from "dayjs";
import { env } from "../../config/env";
import { resend } from "../../lib/resend";

interface RegistrationEmailParams {
  to: string | null | undefined;
  attendeeName: string;
  eventName: string;
  eventDate: Date;
  startTime: Date;
  endTime: Date;
  venue: string | null;
  registrationNumber: string;
  qrCodeDataUrl: string;
}

interface CheckInEmailParams {
  to: string | null | undefined;
  attendeeName: string;
  eventName: string;
}

// Attendee names and organizer-set event names/venues are free text, not
// markup - escape before interpolating into an HTML string so stray
// <, >, or & characters can't distort the email's layout.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapEmailHtml(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #64748b;">
        This message was sent automatically by the I Speak Society Event Registration System. Please do not reply to this email.
      </p>
    </div>
  `;
}

// Best-effort, always. A failed or skipped email must never break
// registration or check-in - both callers just fire this and move on.
async function send(to: string | null | undefined, subject: string, html: string): Promise<void> {
  if (!resend || !to) return;
  try {
    await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
  } catch (err) {
    console.error(`Failed to send email ("${subject}") to ${to}:`, err);
  }
}

export function sendRegistrationConfirmationEmail(params: RegistrationEmailParams): Promise<void> {
  const { to, attendeeName, eventName, eventDate, startTime, endTime, venue, registrationNumber, qrCodeDataUrl } =
    params;

  const html = wrapEmailHtml(
    "You're registered!",
    `
      <p>Hi ${escapeHtml(attendeeName)},</p>
      <p>Your spot for <strong>${escapeHtml(eventName)}</strong> is confirmed. Keep this email handy - you'll need the QR code below to check in on the day.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr><td style="padding: 4px 0; color: #64748b;">Registration No.</td><td style="padding: 4px 0; font-weight: 600;">${escapeHtml(registrationNumber)}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b;">Date</td><td style="padding: 4px 0; font-weight: 600;">${dayjs(eventDate).format("dddd, D MMMM YYYY")}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b;">Time</td><td style="padding: 4px 0; font-weight: 600;">${dayjs(startTime).format("h:mm A")} - ${dayjs(endTime).format("h:mm A")}</td></tr>
        ${venue ? `<tr><td style="padding: 4px 0; color: #64748b;">Venue</td><td style="padding: 4px 0; font-weight: 600;">${escapeHtml(venue)}</td></tr>` : ""}
      </table>
      <div style="text-align: center; margin: 24px 0;">
        <img src="${qrCodeDataUrl}" alt="Your check-in QR code" width="200" height="200" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px;" />
        <p style="font-size: 12px; color: #64748b; margin-top: 8px;">Show this at check-in on the day of the event.</p>
      </div>
    `
  );

  return send(to, `You're registered for ${eventName}`, html);
}

export function sendCheckInThankYouEmail(params: CheckInEmailParams): Promise<void> {
  const { to, attendeeName, eventName } = params;

  const html = wrapEmailHtml(
    "Thanks for joining us!",
    `
      <p>Hi ${escapeHtml(attendeeName)},</p>
      <p>You're checked in to <strong>${escapeHtml(eventName)}</strong> - thank you for coming, and we hope you enjoy the event.</p>
    `
  );

  return send(to, `Thanks for checking in to ${eventName}`, html);
}
