'use client';
import { MediaItem } from '../types/media';

interface Props {
  items: MediaItem[];
  loading: boolean;
  error: string | null;
}

export function MediaGrid({ items, loading, error }: Props) {
  if (loading) return <p className="text-sm opacity-70">Loading...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!items.length) return <p className="text-sm opacity-70">No media yet.</p>;

  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))] w-full">
      {items.map((m) => (
        <div key={m.id} className="border rounded p-2 space-y-2 bg-white/5">
          <div className="aspect-video w-full overflow-hidden rounded bg-black/20 flex items-center justify-center">
            {m.type === 'video' ? (
              <video src={m.url} controls className="w-full h-full object-cover" />
            ) : (
              <img
                src={m.thumbnailUrl || m.url}
                alt={m.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium truncate" title={m.title}>{m.title}</p>
            {m.description && (
              <p className="text-xs line-clamp-2 opacity-80">{m.description}</p>
            )}
            <p className="text-[10px] uppercase tracking-wide opacity-60">
              {m.type} {m.size ? `• ${(m.size / 1024).toFixed(1)} KB` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
