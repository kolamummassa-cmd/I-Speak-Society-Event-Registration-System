"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { FieldType, FormField } from "@isociety/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FIELD_TYPE_LABELS, OPTION_FIELD_TYPES } from "@/lib/field-types";
import { formatApiError } from "@/lib/api-client";

export interface FieldEditorValues {
  label: string;
  fieldType: FieldType;
  placeholder: string;
  helpText: string;
  isRequired: boolean;
  options: { label: string; value: string }[];
  conditionFieldId: string;
  conditionValue: string;
}

interface FieldEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: FormField | null; // null = creating a new custom field
  otherFields: FormField[]; // candidates for the conditional-logic dropdown
  onSave: (values: FieldEditorValues) => Promise<void>;
}

function toValues(field: FormField | null): FieldEditorValues {
  return {
    label: field?.label ?? "",
    fieldType: field?.fieldType ?? "TEXT",
    placeholder: field?.placeholder ?? "",
    helpText: field?.helpText ?? "",
    isRequired: field?.isRequired ?? false,
    options: field?.options.map((o) => ({ label: o.label, value: o.value })) ?? [],
    conditionFieldId: field?.conditionFieldId ?? "",
    conditionValue: field?.conditionValue ?? "",
  };
}

export function FieldEditorDialog({ open, onOpenChange, field, otherFields, onSave }: FieldEditorDialogProps) {
  const [values, setValues] = useState<FieldEditorValues>(toValues(field));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isDefaultField = field?.isDefaultField ?? false;
  const needsOptions = OPTION_FIELD_TYPES.includes(values.fieldType);

  useEffect(() => {
    if (open) {
      setValues(toValues(field));
      setError(null);
    }
  }, [open, field]);

  function set<K extends keyof FieldEditorValues>(key: K, value: FieldEditorValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateOption(index: number, key: "label" | "value", value: string) {
    setValues((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? { ...opt, [key]: value } : opt)),
    }));
  }

  function addOption() {
    setValues((prev) => ({ ...prev, options: [...prev.options, { label: "", value: "" }] }));
  }

  function removeOption(index: number) {
    setValues((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await onSave(values);
      onOpenChange(false);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{field ? "Edit field" : "Add custom field"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="field-label">Label *</Label>
            <Input id="field-label" value={values.label} onChange={(e) => set("label", e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="field-type">Field type</Label>
            <Select
              id="field-type"
              value={values.fieldType}
              disabled={isDefaultField}
              onChange={(e) => set("fieldType", e.target.value as FieldType)}
            >
              {Object.entries(FIELD_TYPE_LABELS).map(([type, label]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="field-placeholder">Placeholder</Label>
            <Input
              id="field-placeholder"
              value={values.placeholder}
              onChange={(e) => set("placeholder", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="field-help">Help text</Label>
            <Textarea
              id="field-help"
              value={values.helpText}
              onChange={(e) => set("helpText", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="field-required">Required</Label>
            <Switch
              id="field-required"
              checked={values.isRequired}
              onCheckedChange={(checked) => set("isRequired", checked)}
            />
          </div>

          {needsOptions && (
            <div className="flex flex-col gap-2">
              <Label>Options *</Label>
              {values.options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Label"
                    value={opt.label}
                    onChange={(e) => updateOption(i, "label", e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4" />
                Add option
              </Button>
            </div>
          )}

          {otherFields.length > 0 && (
            <div className="flex flex-col gap-2 rounded-md border border-border p-3">
              <Label htmlFor="condition-field">Only show this field if...</Label>
              <Select
                id="condition-field"
                value={values.conditionFieldId}
                onChange={(e) => set("conditionFieldId", e.target.value)}
              >
                <option value="">Always show</option>
                {otherFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </Select>
              {values.conditionFieldId && (
                <Input
                  placeholder="equals this value (e.g. Yes)"
                  value={values.conditionValue}
                  onChange={(e) => set("conditionValue", e.target.value)}
                />
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save field"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
