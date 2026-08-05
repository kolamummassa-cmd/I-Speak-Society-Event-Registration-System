"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import type { FormField, RegistrationForm } from "@isociety/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { FieldEditorDialog, type FieldEditorValues } from "@/components/forms/field-editor-dialog";
import { RegistrationFormPreview } from "@/components/forms/registration-form-preview";
import { apiClient, formatApiError } from "@/lib/api-client";
import { FIELD_TYPE_LABELS } from "@/lib/field-types";

export default function FormBuilderPage() {
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  function load() {
    apiClient
      .get<{ data: { form: RegistrationForm } }>(`/events/${params.id}/form`)
      .then((res) => setForm(res.data.form))
      .catch(() => setError("Could not load this form."));
  }

  useEffect(load, [params.id]);

  const fields = form ? [...form.fields].sort((a, b) => a.displayOrder - b.displayOrder) : [];

  async function toggle(field: FormField, key: "isVisible" | "isRequired", value: boolean) {
    await apiClient.patch(`/events/${params.id}/form/fields/${field.id}`, { [key]: value });
    load();
  }

  async function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const reordered = [...fields];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    await apiClient.post(`/events/${params.id}/form/fields/reorder`, {
      fieldIds: reordered.map((f) => f.id),
    });
    load();
  }

  async function handleDelete(field: FormField) {
    if (!window.confirm(`Delete the "${field.label}" field?`)) return;
    await apiClient.delete(`/events/${params.id}/form/fields/${field.id}`);
    load();
  }

  function openCreate() {
    setEditingField(null);
    setDialogOpen(true);
  }

  function openEdit(field: FormField) {
    setEditingField(field);
    setDialogOpen(true);
  }

  async function handleSave(values: FieldEditorValues) {
    const payload = {
      label: values.label,
      fieldType: values.fieldType,
      placeholder: values.placeholder || undefined,
      helpText: values.helpText || undefined,
      isRequired: values.isRequired,
      options: values.options.length > 0 ? values.options.map((o) => ({ label: o.label, value: o.label })) : undefined,
      conditionFieldId: values.conditionFieldId || "",
      conditionValue: values.conditionValue || "",
    };

    if (editingField) {
      await apiClient.patch(`/events/${params.id}/form/fields/${editingField.id}`, payload);
    } else {
      await apiClient.post(`/events/${params.id}/form/fields`, payload);
    }
    load();
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!form) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Registration form</h1>
          <Link href={`/events/${params.id}`} className="text-sm text-muted-foreground hover:underline">
            Back to event
          </Link>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add custom field
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{field.label}</p>
                    <Badge variant="secondary">{FIELD_TYPE_LABELS[field.fieldType]}</Badge>
                    {field.isDefaultField && <Badge variant="outline">Default</Badge>}
                  </div>
                  {field.conditionFieldId && (
                    <p className="text-xs text-muted-foreground">Conditional field</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Visible
                    <Switch
                      checked={field.isVisible}
                      onCheckedChange={(checked) => toggle(field, "isVisible", checked)}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Required
                    <Switch
                      checked={field.isRequired}
                      onCheckedChange={(checked) => toggle(field, "isRequired", checked)}
                    />
                  </label>
                  <div className="flex flex-col">
                    <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEdit(field)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!field.isDefaultField && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(field)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="lg:sticky lg:top-6 lg:self-start">
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
          </CardHeader>
          <CardContent>
            <RegistrationFormPreview fields={form.fields} />
          </CardContent>
        </Card>
      </div>

      <FieldEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        field={editingField}
        otherFields={fields.filter((f) => f.id !== editingField?.id)}
        onSave={handleSave}
      />
    </div>
  );
}
