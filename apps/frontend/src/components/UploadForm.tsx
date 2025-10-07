'use client';
import { useState } from 'react';
import { uploadMedia } from '../lib/api';
import { MediaItem } from '../types/media';

interface Props {
  onUploaded: (item: MediaItem) => void;
}

export function UploadForm({ onUploaded }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Choose a file');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const item = await uploadMedia({
        title: title.trim() || file.name,
        description: description.trim() || undefined,
        file,
        onProgress: (p) => setProgress(p),
      });
      onUploaded(item);
      setTitle('');
      setDescription('');
      setFile(null);
      setProgress(null);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-md border p-4 rounded bg-white/5">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          className="w-full border rounded px-2 py-1 bg-transparent"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My file title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          className="w-full border rounded px-2 py-1 bg-transparent"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={2}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">File</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm"
        />
      </div>
      {progress !== null && (
        <div className="text-xs">Uploading: {progress}%</div>
      )}
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {submitting ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
