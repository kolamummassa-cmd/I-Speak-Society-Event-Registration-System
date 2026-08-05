"use client";

import { useState } from "react";
import type { EventStatus, EventSummary } from "@isociety/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { emptyImageValue, ImageUploadField, type ImageValue } from "./image-upload-field";
import { formatApiError } from "@/lib/api-client";
import { formatDateTimeInput } from "@/lib/format";
import { uploadEventImage } from "@/lib/uploads";

export interface EventFormValues {
  name: string;
  description: string;
  venue: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  organizerName: string;
  logo: ImageValue;
  banner: ImageValue;
  status: EventStatus;
}

const emptyValues: EventFormValues = {
  name: "",
  description: "",
  venue: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  registrationDeadline: "",
  organizerName: "",
  logo: emptyImageValue,
  banner: emptyImageValue,
  status: "DRAFT",
};

export function eventToFormValues(event: EventSummary): EventFormValues {
  return {
    name: event.name,
    description: event.description ?? "",
    venue: event.venue ?? "",
    eventDate: formatDateTimeInput(event.eventDate).slice(0, 10),
    startTime: formatDateTimeInput(event.startTime),
    endTime: formatDateTimeInput(event.endTime),
    registrationDeadline: event.registrationDeadline
      ? formatDateTimeInput(event.registrationDeadline).slice(0, 10)
      : "",
    organizerName: event.organizerName ?? "",
    logo: { url: event.logoUrl ?? "", publicId: event.logoPublicId ?? "", file: null },
    banner: { url: event.bannerUrl ?? "", publicId: event.bannerPublicId ?? "", file: null },
    status: event.status,
  };
}

// Step 1 of saving: everything EXCEPT any image that has a newly selected
// file pending. Nothing touches Cloudinary yet - if this call fails
// validation, no upload ever happens. An image field is only included here
// when there's no pending file, i.e. it's unchanged or was just removed
// ("" signals removal to the API, which allows "" for these two fields
// specifically so it can tell "cleared" apart from "not included").
export function toBasePayload(values: EventFormValues) {
  const { logo, banner, registrationDeadline, ...rest } = values;
  return {
    ...rest,
    registrationDeadline: registrationDeadline || undefined,
    ...(logo.file ? {} : { logoUrl: logo.url, logoPublicId: logo.publicId }),
    ...(banner.file ? {} : { bannerUrl: banner.url, bannerPublicId: banner.publicId }),
  };
}

// Step 2 of saving: called only after step 1 succeeds. Uploads any newly
// selected files to Cloudinary and returns just the fields that changed, to
// be sent as a follow-up patch. Returns {} (nothing to patch) if no new
// files were selected.
export async function uploadPendingImages(values: EventFormValues) {
  const patch: Record<string, string> = {};

  if (values.logo.file) {
    const uploaded = await uploadEventImage(values.logo.file, "logos");
    patch.logoUrl = uploaded.url;
    patch.logoPublicId = uploaded.publicId;
  }
  if (values.banner.file) {
    const uploaded = await uploadEventImage(values.banner.file, "banners");
    patch.bannerUrl = uploaded.url;
    patch.bannerPublicId = uploaded.publicId;
  }

  return patch;
}

interface EventFormProps {
  initialValues?: EventFormValues;
  submitLabel: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
}

export function EventForm({ initialValues = emptyValues, submitLabel, onSubmit }: EventFormProps) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Event name *</Label>
        <Input id="name" required value={values.name} onChange={(e) => set("name", e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="venue">Venue</Label>
          <Input id="venue" value={values.venue} onChange={(e) => set("venue", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="organizerName">Organizer name</Label>
          <Input
            id="organizerName"
            value={values.organizerName}
            onChange={(e) => set("organizerName", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="eventDate">Event date *</Label>
          <Input
            id="eventDate"
            type="date"
            required
            value={values.eventDate}
            onChange={(e) => set("eventDate", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startTime">Start time *</Label>
          <Input
            id="startTime"
            type="datetime-local"
            required
            value={values.startTime}
            onChange={(e) => set("startTime", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endTime">End time *</Label>
          <Input
            id="endTime"
            type="datetime-local"
            required
            value={values.endTime}
            onChange={(e) => set("endTime", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="registrationDeadline">Registration deadline</Label>
          <Input
            id="registrationDeadline"
            type="date"
            value={values.registrationDeadline}
            onChange={(e) => set("registrationDeadline", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={values.status}
            onChange={(e) => set("status", e.target.value as EventStatus)}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ImageUploadField label="Event logo" value={values.logo} onChange={(v) => set("logo", v)} />
        <ImageUploadField label="Event banner" value={values.banner} onChange={(v) => set("banner", v)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
