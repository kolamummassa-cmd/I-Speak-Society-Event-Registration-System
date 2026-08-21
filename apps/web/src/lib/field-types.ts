import type { FieldType } from "@isociety/shared";

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  TEXT: "Short Text",
  LONG_TEXT: "Long Text",
  EMAIL: "Email",
  PHONE: "Phone Number",
  NUMBER: "Number",
  DATE: "Date",
  DROPDOWN: "Dropdown",
  RADIO: "Radio Buttons",
  CHECKBOX: "Checkboxes",
  TOGGLE: "Yes/No Toggle",
  FILE: "File Upload",
};

export const OPTION_FIELD_TYPES: FieldType[] = ["DROPDOWN", "RADIO", "CHECKBOX"];
