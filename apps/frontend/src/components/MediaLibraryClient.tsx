"use client";
import { UploadForm } from "./UploadForm";
import { MediaGrid } from "./MediaGrid";
import { useMedia } from "../hooks/useMedia";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export function MediaLibraryClient() {
  const { items, loading, error, setItems, refresh } = useMedia();

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <UploadForm
          onUploaded={(item) => {
            setItems((prev) => [item, ...prev]);
          }}
        />
        <div className="flex-1 w-full min-w-0 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-heading">Library</h2>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="neutral"
                disabled={loading}
                onClick={() => refresh()}
                className="min-w-32"
              >
                <RefreshCw className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
          </div>
          {error && !loading && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <MediaGrid items={items} loading={loading} error={error} />
        </div>
      </div>
      <Card className="border-dashed bg-secondary-background/60">
        <CardContent className="p-6 text-sm space-y-2">
          <p className="font-heading text-base">Tips</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Refresh to re-fetch server state if you suspect drift.</li>
            <li>Videos display native controls; images show thumbnails.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
