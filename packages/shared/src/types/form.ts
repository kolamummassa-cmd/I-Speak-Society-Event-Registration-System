export type FieldType =
  | "TEXT"
  | "LONG_TEXT"
  | "EMAIL"
  | "PHONE"
  | "NUMBER"
  | "DATE"
  | "DROPDOWN"
  | "RADIO"
  | "CHECKBOX"
  | "TOGGLE"
  | "FILE";

// Field types that need a list of choices.
export const OPTION_FIELD_TYPES: FieldType[] = ["DROPDOWN", "RADIO", "CHECKBOX"];

export interface FieldOption {
  id: string;
  label: string;
  value: string;
  displayOrder: number;
}

export interface FormField {
  id: string;
  formId: string;
  fieldKey: string;
  label: string;
  fieldType: FieldType;
  isDefaultField: boolean;
  isVisible: boolean;
  isRequired: boolean;
  placeholder: string | null;
  helpText: string | null;
  displayOrder: number;
  conditionFieldId: string | null;
  conditionValue: string | null;
  options: FieldOption[];
}

export interface RegistrationForm {
  id: string;
  eventId: string;
  isPublished: boolean;
  fields: FormField[];
}
