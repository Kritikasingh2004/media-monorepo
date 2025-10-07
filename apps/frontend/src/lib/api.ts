import { MediaItem } from '../types/media';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export async function listMedia(): Promise<MediaItem[]> {
  const res = await fetch(`${BASE_URL}/media`);
  if (!res.ok) throw new Error('Failed to fetch media');
  return res.json();
}

export interface UploadParams {
  title: string;
  description?: string;
  file: File;
  onProgress?: (pct: number) => void;
}

export async function uploadMedia({ title, description, file, onProgress }: UploadParams): Promise<MediaItem> {
  const form = new FormData();
  form.append('title', title);
  if (description) form.append('description', description);
  form.append('file', file);

  // Using XHR for progress (fetch has no native progress for upload)
  const xhr = new XMLHttpRequest();
  const promise: Promise<MediaItem> = new Promise((resolve, reject) => {
    xhr.open('POST', `${BASE_URL}/media`);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      };
    }
    xhr.send(form);
  });
  return promise;
}
