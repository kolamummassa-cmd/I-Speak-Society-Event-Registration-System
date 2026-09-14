import { apiClient } from "./api-client";

export interface UploadedImage {
  url: string;
  publicId: string;
}

export function uploadEventImage(file: File, folder: "logos" | "banners"): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  return apiClient
    .upload<{ data: UploadedImage }>("/uploads", formData)
    .then((res) => res.data);
}
