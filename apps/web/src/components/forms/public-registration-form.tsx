"use client";

import { useMemo, useState } from "react";
import type { FormField } from "@isociety/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-client";

export function fieldKeyFor(field: FormField): string {
  return field.isDefaultField ? field.fieldKey : field.id;
}

type Value = string | string[];

interface PublicRegistrationFormProps {
  fields: FormField[];
  onSubmit: (responses: Record<string, Value>) => Promise<void>;
}

export function PublicRegistrationForm({ fields, onSubmit }: PublicRegistrationFormProps) {
  const [values, setValues] = useState<Record<string, Value>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.displayOrder - b.displayOrder),
    [fields]
  );

  function isShown(field: FormField): boolean {
    if (field.fieldKey === "full_name") return true; // always required, see backend
    if (!field.isVisible) return false;
    if (!field.conditionFieldId) return true;
    const conditionField = fields.find((f) => f.id === field.conditionFieldId);
    if (!conditionField) return true;
    return values[fieldKeyFor(conditionField)] === field.conditionValue;
  }

  const visibleFields = sortedFields.filter(isShown);

  function set(key: string, value: Value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    for (const field of visibleFields) {
      const key = fieldKeyFor(field);
      const value = values[key];
      const isEmpty = value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
      const required = field.isRequired || field.fieldKey === "full_name";
      if (required && isEmpty) {
        nextErrors[key] = `${field.label} is required`;
        continue;
      }
      if (!isEmpty && field.fieldType === "EMAIL" && typeof value === "string") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) nextErrors[key] = "Enter a valid email address";
      }
      if (!isEmpty && field.fieldType === "NUMBER" && typeof value === "string" && Number.isNaN(Number(value))) {
        nextErrors[key] = "Enter a valid number";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Only send responses for fields actually shown (a hidden conditional
      // field's stale value from before a condition changed shouldn't submit).
      const visibleKeys = new Set(visibleFields.map(fieldKeyFor));
      const payload = Object.fromEntries(
        Object.entries(values).filter(([key]) => visibleKeys.has(key))
      );
      await onSubmit(payload);
    } catch (err) {
      // The register endpoint validates dynamically against the event's
      // own form, so its field errors come back as { fieldKey: "message" }
      // (one string per field) rather than the zod-style array shape used
      // elsewhere - map them directly onto each field's inline error.
      if (err instanceof ApiError && err.details && typeof err.details === "object") {
        setErrors((prev) => ({ ...prev, ...(err.details as Record<string, string>) }));
        setFormError("Please fix the errors below.");
      } else {
        setFormError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {visibleFields.map((field) => {
        const key = fieldKeyFor(field);
        return (
          <div key={field.id} className="flex flex-col gap-1.5">
            <Label htmlFor={key}>
              {field.label}
              {(field.isRequired || field.fieldKey === "full_name") && (
                <span className="text-destructive"> *</span>
              )}
            </Label>
            <FieldControl field={field} fieldKey={key} value={values[key]} onChange={(v) => set(key, v)} />
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
            {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
          </div>
        );
      })}

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Complete Registration"}
      </Button>
    </form>
  );
}

function FieldControl({
  field,
  fieldKey,
  value,
  onChange,
}: {
  field: FormField;
  fieldKey: string;
  value: Value | undefined;
  onChange: (value: Value) => void;
}) {
  const stringValue = typeof value === "string" ? value : "";
  const arrayValue = Array.isArray(value) ? value : [];

  switch (field.fieldType) {
    case "LONG_TEXT":
      return (
        <Textarea id={fieldKey} placeholder={field.placeholder ?? undefined} value={stringValue} onChange={(e) => onChange(e.target.value)} />
      );
    case "EMAIL":
      return (
        <Input id={fieldKey} type="email" placeholder={field.placeholder ?? undefined} value={stringValue} onChange={(e) => onChange(e.target.value)} />
      );
    case "PHONE":
      return (
        <Input id={fieldKey} type="tel" placeholder={field.placeholder ?? undefined} value={stringValue} onChange={(e) => onChange(e.target.value)} />
      );
    case "NUMBER":
      return (
        <Input id={fieldKey} type="number" placeholder={field.placeholder ?? undefined} value={stringValue} onChange={(e) => onChange(e.target.value)} />
      );
    case "DATE":
      return <Input id={fieldKey} type="date" value={stringValue} onChange={(e) => onChange(e.target.value)} />;
    case "DROPDOWN":
      return (
        <Select id={fieldKey} value={stringValue} onChange={(e) => onChange(e.target.value)}>
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
                name={fieldKey}
                value={opt.value}
                checked={stringValue === opt.value}
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
              <input
                type="checkbox"
                value={opt.value}
                checked={arrayValue.includes(opt.value)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...arrayValue, opt.value]
                      : arrayValue.filter((v) => v !== opt.value)
                  )
                }
              />
              {opt.label}
            </label>
          ))}
        </div>
      );
    case "TOGGLE":
      return <Switch checked={stringValue === "Yes"} onCheckedChange={(c) => onChange(c ? "Yes" : "No")} />;
    case "FILE":
      return (
        <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
          File upload isn&apos;t available yet - this field is skipped for now.
        </div>
      );
    default:
      return (
        <Input id={fieldKey} placeholder={field.placeholder ?? undefined} value={stringValue} onChange={(e) => onChange(e.target.value)} />
      );
  }
}
