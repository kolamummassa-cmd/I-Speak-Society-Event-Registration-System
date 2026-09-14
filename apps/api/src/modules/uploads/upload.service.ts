import { cloudinary } from "../../lib/cloudinary";
import { AppError } from "../../middleware/errorHandler";

export interface UploadedImage {
  url: string;
  publicId: string;
}

export function uploadImageBuffer(buffer: Buffer, folder: string): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `isociety-ers/${folder}`, resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(new AppError(502, "Image upload failed. Try again."));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

// Best-effort cleanup - called when an image is replaced, removed, or its
// event is deleted. Never throws: a failed delete on Cloudinary's side
// shouldn't block the actual database operation the caller is doing.
export async function deleteImage(publicId: string | null | undefined): Promise<void> {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`Failed to delete Cloudinary image ${publicId}:`, err);
  }
}
