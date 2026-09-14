import type { Request, Response } from "express";
import { requireParam } from "../../utils/requireParam";
import * as formService from "./form.service";

export async function getFormHandler(req: Request, res: Response) {
  const form = await formService.getForm(requireParam(req, "id"));
  res.status(200).json({ success: true, data: { form } });
}

export async function createFieldHandler(req: Request, res: Response) {
  const field = await formService.addCustomField(requireParam(req, "id"), req.body, req.user!.sub);
  res.status(201).json({ success: true, data: { field } });
}

export async function updateFieldHandler(req: Request, res: Response) {
  const field = await formService.updateField(
    requireParam(req, "id"),
    requireParam(req, "fieldId"),
    req.body,
    req.user!.sub
  );
  res.status(200).json({ success: true, data: { field } });
}

export async function deleteFieldHandler(req: Request, res: Response) {
  await formService.deleteField(requireParam(req, "id"), requireParam(req, "fieldId"), req.user!.sub);
  res.status(204).send();
}

export async function reorderFieldsHandler(req: Request, res: Response) {
  const form = await formService.reorderFields(
    requireParam(req, "id"),
    req.body.fieldIds,
    req.user!.sub
  );
  res.status(200).json({ success: true, data: { form } });
}
