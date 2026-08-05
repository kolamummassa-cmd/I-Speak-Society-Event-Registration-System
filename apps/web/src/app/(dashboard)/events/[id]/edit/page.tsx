"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { EventSummary } from "@isociety/shared";
import {
  EventForm,
  type EventFormValues,
  eventToFormValues,
  toBasePayload,
  uploadPendingImages,
} from "@/components/events/event-form";
import { apiClient } from "@/lib/api-client";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [initialValues, setInitialValues] = useState<EventFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ data: { event: EventSummary } }>(`/events/${params.id}`)
      .then((res) => setInitialValues(eventToFormValues(res.data.event)))
      .catch(() => setError("Could not load this event."));
  }, [params.id]);

  async function handleSubmit(values: EventFormValues) {
    // Step 1: save everything except any pending new image. If validation
    // fails here, no upload ever happens.
    await apiClient.patch(`/events/${params.id}`, toBasePayload(values));

    // Step 2: only now, upload any newly selected images and attach them -
    // the API's existing diffing then cleans up the old Cloudinary asset.
    const imagePatch = await uploadPendingImages(values);
    if (Object.keys(imagePatch).length > 0) {
      await apiClient.patch(`/events/${params.id}`, imagePatch);
    }

    router.push("/events");
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!initialValues) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Edit event</h1>
      <EventForm initialValues={initialValues} submitLabel="Save changes" onSubmit={handleSubmit} />
    </div>
  );
}
