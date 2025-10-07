import { useCallback, useEffect, useState } from 'react';
import { MediaItem } from '../types/media';
import { listMedia } from '../lib/api';

export function useMedia() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMedia();
      setItems(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh, setItems };
}
