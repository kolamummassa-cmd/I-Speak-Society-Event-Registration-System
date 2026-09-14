"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export interface ImageValue {
  url: string; // already-persisted URL (empty if none, or pending removal)
  publicId: string; // already-persisted Cloudinary public_id
  file: File | null; // newly selected file, not yet uploaded
}

export const emptyImageValue: ImageValue = { url: "", publicId: "", file: null };

interface ImageUploadFieldProps {
  label: string;
  value: ImageValue;
  onChange: (value: ImageValue) => void;
}

// Deliberately does NOT upload on selection. The file is held here until
// the surrounding form actually saves - nothing reaches Cloudinary unless
// the event create/update it belongs to succeeds first (see
// event-form.tsx's uploadPendingImages).
export function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(value.url);

  useEffect(() => {
    if (!value.file) {
      setPreviewUrl(value.url);
      return;
    }
    const objectUrl = URL.createObjectURL(value.file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [value.file, value.url]);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Only JPEG, PNG, WEBP, or GIF images are allowed.");
    } else if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("File is too large (max 5MB).");
    } else {
      onChange({ ...value, file });
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove() {
    setError(null);
    onChange(emptyImageValue);
  }

  const hasImage = Boolean(previewUrl);

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelected}
      />
      <div className="flex items-center gap-3">
        {hasImage ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-md border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote/blob URL, not worth next/image config here */}
            <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5"
              aria-label={`Remove ${label}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <ImagePlus className="h-4 w-4" />
          {hasImage ? "Replace image" : "Upload image"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {value.file && !error && (
        <p className="text-xs text-muted-foreground">
          Selected - will upload once you save.
        </p>
      )}
      <p className="text-xs text-muted-foreground">JPEG, PNG, WEBP, or GIF - max 5MB.</p>
    </div>
  );
}
