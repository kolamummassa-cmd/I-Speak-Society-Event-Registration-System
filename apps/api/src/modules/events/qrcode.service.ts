import QRCode from "qrcode";
import { prisma } from "@isociety/database";
import { env } from "../../config/env";
import { deleteImage, uploadImageBuffer } from "../uploads/upload.service";

export function buildRegistrationUrl(eventId: string): string {
  return `${env.APP_BASE_URL}/register/${eventId}`;
}

// Generates (or regenerates) the QR code for an event and persists the
// result. Called right after an event is created, and again from the
// manual "regenerate" endpoint. Deletes the previous Cloudinary asset first
// if one already existed, so regenerating never leaves an orphan behind.
export async function generateEventQrCode(eventId: string) {
  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    select: { qrCodePublicId: true },
  });

  const registrationUrl = buildRegistrationUrl(eventId);
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
