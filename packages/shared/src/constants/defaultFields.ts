import type { FieldType } from "../types/form";

export interface DefaultFieldDefinition {
  fieldKey: string;
  label: string;
  fieldType: FieldType;
  isRequired: boolean;
  displayOrder: number;
  options?: { label: string; value: string }[];
}

// The 8 built-in fields every registration form starts with. Organizers can
// show/hide, require/optional, rename, and reorder these, but can't delete
// them (only custom fields can be deleted) - see form.service.ts.
export const DEFAULT_FIELDS: DefaultFieldDefinition[] = [
  { fieldKey: "full_name", label: "Full Name", fieldType: "TEXT", isRequired: true, displayOrder: 0 },
  { fieldKey: "phone", label: "Phone Number", fieldType: "PHONE", isRequired: true, displayOrder: 1 },
  { fieldKey: "email", label: "Email Address", fieldType: "EMAIL", isRequired: true, displayOrder: 2 },
  { fieldKey: "organization", label: "Organization", fieldType: "TEXT", isRequired: false, displayOrder: 3 },
  { fieldKey: "position", label: "Position", fieldType: "TEXT", isRequired: false, displayOrder: 4 },
  {
    fieldKey: "gender",
    label: "Gender",
    fieldType: "DROPDOWN",
    isRequired: false,
    displayOrder: 5,
    options: [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" },
      { label: "Prefer not to say", value: "Prefer not to say" },
    ],
  },
  { fieldKey: "country", label: "Country", fieldType: "TEXT", isRequired: false, displayOrder: 6 },
  { fieldKey: "city", label: "City", fieldType: "TEXT", isRequired: false, displayOrder: 7 },
];
