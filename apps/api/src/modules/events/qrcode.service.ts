import QRCode from "qrcode";
import { prisma } from "@isociety/database";
import { deleteImage, uploadImageBuffer } from "../uploads/upload.service";

export function buildRegistrationUrl(eventId: string, baseUrl: string): string {
  return `${baseUrl}/register/${eventId}`;
}

// Generates (or regenerates) the QR code for an event and persists the
// result. Called right after an event is created, and again from the
// manual "regenerate" endpoint. Deletes the previous Cloudinary asset first
// if one already existed, so regenerating never leaves an orphan behind.
// `baseUrl` comes from the triggering request's Origin (see
// utils/resolveAppBaseUrl.ts) so the link always matches the web app's
// current domain instead of a static, easily-stale env var.
export async function generateEventQrCode(eventId: string, baseUrl: string) {
  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    select: { qrCodePublicId: true },
  });

  const registrationUrl = buildRegistrationUrl(eventId, baseUrl);
  const buffer = await QRCode.toBuffer(registrationUrl, {
    type: "png",
    width: 512,
    margin: 2,
  });

  const { url, publicId } = await uploadImageBuffer(buffer, "qrcodes");

  if (existing?.qrCodePublicId) {
    await deleteImage(existing.qrCodePublicId);
  }

  return prisma.event.update({
    where: { id: eventId },
    data: { registrationUrl, qrCodeImageUrl: url, qrCodePublicId: publicId },
    include: { _count: { select: { attendees: true } } },
  });
}
