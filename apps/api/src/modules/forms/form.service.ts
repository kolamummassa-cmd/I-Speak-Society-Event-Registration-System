import type { CreateCustomFieldInput, UpdateFieldInput } from "@isociety/shared";
import { AppError } from "../../middleware/errorHandler";
import { recordAuditLog } from "../../utils/audit";
import { slugify, uniqueSlug } from "../../utils/slugify";
import * as formRepository from "./form.repository";

export async function getForm(eventId: string) {
  const form = await formRepository.findByEventId(eventId);
  if (!form) throw new AppError(404, "Registration form not found for this event");
  return form;
}

async function validateCondition(formId: string, conditionFieldId: string | undefined, selfId?: string) {
  if (!conditionFieldId) return;
  if (conditionFieldId === selfId) {
    throw new AppError(400, "A field can't depend on itself");
  }
  const target = await formRepository.findFieldById(conditionFieldId);
  if (!target || target.formId !== formId) {
    throw new AppError(400, "conditionFieldId must reference a field on the same form");
  }
}

export async function addCustomField(eventId: string, input: CreateCustomFieldInput, userId: string) {
  const form = await getForm(eventId);

  const existingKeys = new Set(form.fields.map((f) => f.fieldKey));
  const fieldKey = uniqueSlug(slugify(input.label), existingKeys);

  const conditionFieldId = input.conditionFieldId || undefined;
  await validateCondition(form.id, conditionFieldId);

  const field = await formRepository.createField(
    form.id,
    {
      fieldKey,
      label: input.label,
      fieldType: input.fieldType,
      isDefaultField: false,
      isVisible: input.isVisible ?? true,
      isRequired: input.isRequired ?? false,
      placeholder: input.placeholder || null,
      helpText: input.helpText || null,
      displayOrder: input.displayOrder ?? form.fields.length,
      conditionFieldId: conditionFieldId ?? null,
      conditionValue: input.conditionValue || null,
    },
    input.options
  );

  await recordAuditLog({
    userId,
    action: "FORM_FIELD_CREATED",
    entityType: "FormField",
    entityId: field.id,
    eventId,
    changes: input,
  });

  return field;
}

export async function updateField(
  eventId: string,
  fieldId: string,
  input: UpdateFieldInput,
  userId: string
) {
  const field = await formRepository.findFieldById(fieldId);
  if (!field || field.form.eventId !== eventId) {
    throw new AppError(404, "Form field not found");
  }

  if (field.isDefaultField && input.fieldType && input.fieldType !== field.fieldType) {
    throw new AppError(400, "Default fields can't change type");
  }

  const conditionFieldId = input.conditionFieldId === "" ? null : input.conditionFieldId;
  if (conditionFieldId) {
    await validateCondition(field.formId, conditionFieldId, fieldId);
  }

  const updated = await formRepository.updateField(
    fieldId,
    {
      label: input.label,
      placeholder: input.placeholder === "" ? null : input.placeholder,
      helpText: input.helpText === "" ? null : input.helpText,
      isRequired: input.isRequired,
      isVisible: input.isVisible,
      displayOrder: input.displayOrder,
      fieldType: field.isDefaultField ? undefined : input.fieldType,
      conditionFieldId,
      conditionValue: input.conditionValue === "" ? null : input.conditionValue,
    },
    input.options
  );

  await recordAuditLog({
    userId,
    action: "FORM_FIELD_UPDATED",
    entityType: "FormField",
    entityId: fieldId,
    eventId,
    changes: input,
  });

  return updated;
}

export async function deleteField(eventId: string, fieldId: string, userId: string) {
  const field = await formRepository.findFieldById(fieldId);
  if (!field || field.form.eventId !== eventId) {
    throw new AppError(404, "Form field not found");
  }
  if (field.isDefaultField) {
    throw new AppError(400, "Default fields can't be deleted - hide them instead");
  }

  await formRepository.deleteField(fieldId);

  await recordAuditLog({
    userId,
    action: "FORM_FIELD_DELETED",
    entityType: "FormField",
    entityId: fieldId,
    eventId,
    changes: { label: field.label },
  });
}

export async function reorderFields(eventId: string, fieldIds: string[], userId: string) {
  const form = await getForm(eventId);
  const validIds = new Set(form.fields.map((f) => f.id));

  if (fieldIds.length !== validIds.size || !fieldIds.every((id) => validIds.has(id))) {
    throw new AppError(400, "fieldIds must include every field on this form exactly once");
  }

  await formRepository.reorderFields(fieldIds);

  await recordAuditLog({
    userId,
    action: "FORM_FIELDS_REORDERED",
    entityType: "RegistrationForm",
    entityId: form.id,
    eventId,
  });

  return getForm(eventId);
}
