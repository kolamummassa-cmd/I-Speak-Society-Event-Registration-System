import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { uploadImage } from "../../middleware/upload";
import { asyncHandler } from "../../utils/asyncHandler";
import { uploadImageHandler } from "./upload.controller";

export const uploadRouter = Router();

uploadRouter.post("/", authenticate, uploadImage.single("file"), asyncHandler(uploadImageHandler));
