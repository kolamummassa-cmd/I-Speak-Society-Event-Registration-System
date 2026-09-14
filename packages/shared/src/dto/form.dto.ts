import { z } from "zod";

export const fieldTypeSchema = z.enum([
  "TEXT",
  "LONG_TEXT",
  "EMAIL",
  "PHONE",
  "NUMBER",
  "DATE",
  "DROPDOWN",
  "RADIO",
  "CHECKBOX",
  "TOGGLE",
  "FILE",
]);

const OPTION_TYPES = new Set(["DROPDOWN", "RADIO", "CHECKBOX"]);

export const fieldOptionInputSchema = z.object({
  label: z.string().min(1, "Option label is required").max(200),
  value: z.string().min(1, "Option value is required").max(200),
});

// Shared by create and update - conditional-logic and option-list
// consistency checks apply the same way to both.
const fieldBaseSchema = z.object({
  label: z.string().min(1, "Label is required").max(200),
  fieldType: fieldTypeSchema,
  placeholder: z.string().max(200).optional(),
  helpText: z.string().max(500).optional(),
  isRequired: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  options: z.array(fieldOptionInputSchema).optional(),
  conditionFieldId: z.string().optional().or(z.literal("")),
  conditionValue: z.string().max(200).optional().or(z.literal("")),
});

function withOptionsWhenNeeded(data: { fieldType: string; options?: unknown[] }) {
  if (!OPTION_TYPES.has(data.fieldType)) return true;
  return Array.isArray(data.options) && data.options.length > 0;
}

export const createCustomFieldSchema = fieldBaseSchema.refine(withOptionsWhenNeeded, {
  message: "At least one option is required for this field type",
  path: ["options"],
});

export type CreateCustomFieldInput = z.infer<typeof createCustomFieldSchema>;

// Default fields can only have a subset of properties edited (visibility,
// required, label, placeholder, help text, order, conditional logic) - not
// their fieldType or fieldKey. Custom fields can have all of the above.
export const updateFieldSchema = fieldBaseSchema.partial().refine(
  (data) => (data.fieldType ? withOptionsWhenNeeded(data as { fieldType: string; options?: unknown[] }) : true),
  { message: "At least one option is required for this field type", path: ["options"] }
);

export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;

export const reorderFieldsSchema = z.object({
  fieldIds: z.array(z.string()).min(1),
});

export type ReorderFieldsInput = z.infer<typeof reorderFieldsSchema>;
