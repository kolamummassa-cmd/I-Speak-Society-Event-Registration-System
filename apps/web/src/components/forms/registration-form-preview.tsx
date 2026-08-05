"use client";

import { useMemo, useState } from "react";
import type { FormField } from "@isociety/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface RegistrationFormPreviewProps {
  fields: FormField[];
}

// Renders the form exactly as an attendee will see it, including
// conditional show/hide - but doesn't submit anywhere. Reused as-is by the
// real public registration page in Phase 7.
export function RegistrationFormPreview({ fields }: RegistrationFormPreviewProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  const visibleFields = useMemo(
    () => [...fields].filter((f) => f.isVisible).sort((a, b) => a.displayOrder - b.displayOrder),
    [fields]
  );

  function isShown(field: FormField): boolean {
    if (!field.conditionFieldId) return true;
    return values[field.conditionFieldId] === field.conditionValue;
  }

  return (
    <div className="flex flex-col gap-5">
      {visibleFields.length === 0 && (
        <p className="text-sm text-muted-foreground">No visible fields yet.</p>
      )}
      {visibleFields.map((field) => {
        if (!isShown(field)) return null;
        return (
          <div key={field.id} className="flex flex-col gap-1.5">
            <Label htmlFor={field.id}>
              {field.label}
              {field.isRequired && <span className="text-destructive"> *</span>}
            </Label>
            <FieldInput field={field} value={values[field.id] ?? ""} onChange={(v) => setValues((p) => ({ ...p, [field.id]: v }))} />
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
          </div>
        );
      })}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
}) {
  switch (field.fieldType) {
    case "LONG_TEXT":
      return (
        <Textarea id={field.id} placeholder={field.placeholder ?? undefined} value={value} onChange={(e) => onChange(e.target.value)} />
      );
    case "EMAIL":
      return (
        <Input id={field.id} type="email" placeholder={field.placeholder ?? undefined} value={value} onChange={(e) => onChange(e.target.value)} />
      );
    case "PHONE":
      return (
        <Input id={field.id} type="tel" placeholder={field.placeholder ?? undefined} value={value} onChange={(e) => onChange(e.target.value)} />
      );
    case "NUMBER":
      return (
        <Input id={field.id} type="number" placeholder={field.placeholder ?? undefined} value={value} onChange={(e) => onChange(e.target.value)} />
      );
    case "DATE":
      return <Input id={field.id} type="date" value={value} onChange={(e) => onChange(e.target.value)} />;
    case "DROPDOWN":
      return (
        <Select id={field.id} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select...</option>
          {field.options.map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      );
    case "RADIO":
      return (
        <div className="flex flex-col gap-2">
          {field.options.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={field.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      );
    case "CHECKBOX":
      return (
        <div className="flex flex-col gap-2">
          {field.options.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" value={opt.value} />
              {opt.label}
            </label>
          ))}
        </div>
      );
    case "TOGGLE":
      return <Switch checked={value === "Yes"} onCheckedChange={(c) => onChange(c ? "Yes" : "No")} />;
    case "FILE":
      return <Input id={field.id} type="file" disabled title="File upload is enabled on the real registration page" />;
    default:
      return (
        <Input id={field.id} placeholder={field.placeholder ?? undefined} value={value} onChange={(e) => onChange(e.target.value)} />
      );
  }
}
