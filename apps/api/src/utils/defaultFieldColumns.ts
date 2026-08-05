// Default form fields map 1:1 to real Attendee columns (a deliberate schema
// choice from Phase 2, for fast search/filter/export) rather than living in
// AttendeeResponse like custom fields do. Shared between the public
// registration flow and the reporting module so the mapping can't drift.
export const DEFAULT_FIELD_COLUMNS: Record<string, string> = {
  full_name: "fullName",
  phone: "phone",
  email: "email",
  organization: "organization",
  position: "position",
  gender: "gender",
  country: "country",
  city: "city",
};
