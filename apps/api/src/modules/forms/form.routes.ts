import { Router } from "express";
import { createCustomFieldSchema, reorderFieldsSchema, updateFieldSchema } from "@isociety/shared";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createFieldHandler,
  deleteFieldHandler,
  getFormHandler,
  reorderFieldsHandler,
  updateFieldHandler,
} from "./form.controller";

// Mounted at /api/events/:id/form with mergeParams - authenticate is
// already applied by the parent eventRouter.
export const formRouter = Router({ mergeParams: true });

formRouter.get("/", asyncHandler(getFormHandler));
formRouter.post("/fields", validateBody(createCustomFieldSchema), asyncHandler(createFieldHandler));
formRouter.patch(
  "/fields/:fieldId",
  validateBody(updateFieldSchema),
  asyncHandler(updateFieldHandler)
);
formRouter.delete("/fields/:fieldId", asyncHandler(deleteFieldHandler));
formRouter.post(
  "/fields/reorder",
  validateBody(reorderFieldsSchema),
  asyncHandler(reorderFieldsHandler)
);
