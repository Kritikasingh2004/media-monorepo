export interface MediaItem {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  type: string; // 'image' | 'video'
  mimeType?: string | null;
  size?: number | null;
  uploadedAt: string; // ISO string
  thumbnailUrl?: string | null; // future use
}
