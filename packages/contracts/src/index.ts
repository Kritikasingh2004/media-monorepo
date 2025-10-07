export interface MediaItem {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  type: "image" | "video" | string;
  mimeType?: string | null;
  size?: number | null;
  uploadedAt: string; // ISO date string
  thumbnailUrl?: string | null;
}

export interface CreateMediaInput {
  title: string;
  description?: string;
}
