"use client";

import { useRouter } from "next/navigation";
import type { EventSummary } from "@isociety/shared";
import {
  EventForm,
  type EventFormValues,
  toBasePayload,
  uploadPendingImages,
} from "@/components/events/event-form";
import { apiClient } from "@/lib/api-client";

export default function NewEventPage() {
  const router = useRouter();

  async function handleSubmit(values: EventFormValues) {
    // Step 1: create the event without touching Cloudinary. If this fails
    // validation, nothing is ever uploaded.
    const created = await apiClient.post<{ data: { event: EventSummary } }>(
      "/events",
      toBasePayload(values)
    );

    // Step 2: only now that the event exists, upload any selected images
    // and attach the resulting URLs.
    const imagePatch = await uploadPendingImages(values);
    if (Object.keys(imagePatch).length > 0) {
      await apiClient.patch(`/events/${created.data.event.id}`, imagePatch);
    }

    router.push("/events");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 py-4">
      <h1 className="text-center text-2xl font-semibold">Create event</h1>
      <EventForm submitLabel="Create event" onSubmit={handleSubmit} />
    </div>
  );
}
