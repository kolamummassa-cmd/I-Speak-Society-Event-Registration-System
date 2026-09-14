import type { Request, Response } from "express";
import { AppError } from "../../middleware/errorHandler";
import { uploadImageBuffer } from "./upload.service";

export async function uploadImageHandler(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError(400, "No file was uploaded");
  }

  // Folder is a fixed allow-list, not user input - keeps Cloudinary assets
  // organized without letting a client write to an arbitrary path.
  const folder = req.body.folder === "logos" || req.body.folder === "banners" ? req.body.folder : "misc";

  const { url, publicId } = await uploadImageBuffer(req.file.buffer, folder);
  res.status(201).json({ success: true, data: { url, publicId } });
}
