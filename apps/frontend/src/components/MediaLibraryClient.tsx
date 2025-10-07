"use client";
import { UploadForm } from "./UploadForm";
import { MediaGrid } from "./MediaGrid";
import { useMedia } from "../hooks/useMedia";

export function MediaLibraryClient() {
  const { items, loading, error, setItems } = useMedia();
  return (
    <>
      <UploadForm
        onUploaded={(item) => {
          setItems((prev) => [item, ...prev]);
        }}
      />
      <section>
        <h2 className="text-lg font-medium mb-3">Your Files</h2>
        <MediaGrid items={items} loading={loading} error={error} />
      </section>
    </>
  );
}
