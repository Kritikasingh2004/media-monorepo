import { MediaItem } from "@media/contracts";
import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export async function listMedia(): Promise<MediaItem[]> {
  const res = await fetch(`${BASE_URL}/media`);
  if (!res.ok) throw new Error("Failed to fetch media");
  return res.json();
}

export interface UploadParams {
  title: string;
  description?: string;
  file: File;
  onProgress?: (pct: number) => void;
}

export async function uploadMedia({
  title,
  description,
  file,
  onProgress,
}: UploadParams): Promise<MediaItem> {
  const form = new FormData();
  form.append("title", title);
  if (description) form.append("description", description);
  form.append("file", file); // field name must match FileInterceptor('file') on backend

  try {
    const response = await axios.post<MediaItem>(`${BASE_URL}/media`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (evt.total) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          onProgress?.(pct);
        }
      },
    });
    return response.data;
  } catch (err: any) {
    // error message
    const message =
      err?.response?.data?.message || err?.message || "Upload failed";
    throw new Error(message);
  }
}
