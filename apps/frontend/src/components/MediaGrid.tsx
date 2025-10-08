"use client";
import { MediaItem } from "@media/contracts";
import { BASE_URL } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle as DTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  items: MediaItem[];
  loading: boolean;
  error: string | null;
}

const GRID_SKELETON_COUNT = 8;

export function MediaGrid({ items, loading, error }: Props) {
  return (
    <Card className="w-full">
      <CardHeader className="flex-row justify-between items-center">
        <CardTitle className="text-lg">YOUR FILES</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>Failed to load</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        {!error && (
          <ScrollArea className="h-[540px]">
            <div className="p-4">
              {loading ? (
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                  {Array.from({ length: GRID_SKELETON_COUNT }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-video w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : !items.length ? (
                <div className="text-sm opacity-70 p-6 text-center border-dashed border-2 border-border rounded-base bg-secondary-background shadow-shadow">
                  No media yet. Upload something to get started.
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                  {items.map((m) => {
                    const sizeKB =
                      m.size !== null && m.size !== undefined
                        ? (m.size / 1024).toFixed(1) + " KB"
                        : undefined;
                    return (
                      <Dialog key={m.id}>
                        <DialogTrigger asChild>
                          <button
                            className="text-left rounded-base border-2 border-border bg-secondary-background shadow-shadow flex flex-col overflow-hidden hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-transform focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black"
                            aria-label={`Open ${m.title} ${m.type} preview`}
                          >
                            <div className="aspect-video w-full bg-black/10 flex items-center justify-center overflow-hidden border-b-2 border-border">
                              {m.type === "video" ? (
                                <video
                                  src={`${BASE_URL}/media/${m.id}/stream`}
                                  className="w-full h-full object-cover"
                                  preload="metadata"
                                  muted
                                  onError={(e) => {
                                    const el = e.currentTarget;
                                    if (!el.dataset._fallbackUsed) {
                                      el.dataset._fallbackUsed = "1";
                                      el.src = m.url; // fallback to direct public URL
                                    }
                                  }}
                                />
                              ) : (
                                <img
                                  src={m.thumbnailUrl || m.url}
                                  alt={m.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              )}
                            </div>
                            <div className="p-3 space-y-1">
                              <p
                                className="text-sm font-heading truncate"
                                title={m.title}
                              >
                                {m.title}
                              </p>
                              {m.description && (
                                <p className="text-xs line-clamp-2 opacity-80">
                                  {m.description}
                                </p>
                              )}
                              <p className="text-[10px] uppercase tracking-wide opacity-60">
                                {m.type}
                                {sizeKB ? ` • ${sizeKB}` : ""}
                              </p>
                            </div>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader className="gap-1">
                            <DTitle>{m.title}</DTitle>
                            <DialogDescription className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide opacity-70">
                              <span>{m.type}</span>
                              {sizeKB && <span>• {sizeKB}</span>}
                              {m.mimeType && <span>• {m.mimeType}</span>}
                              <span>
                                Uploaded{" "}
                                {new Date(m.uploadedAt).toLocaleString()}
                              </span>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="rounded-base border-2 border-border overflow-hidden bg-secondary-background aspect-video flex items-center justify-center">
                            {m.type === "video" ? (
                              <video
                                src={`${BASE_URL}/media/${m.id}/stream`}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const el = e.currentTarget;
                                  if (!el.dataset._fallbackUsed) {
                                    el.dataset._fallbackUsed = "1";
                                    el.src = m.url;
                                  }
                                }}
                              />
                            ) : (
                              <img
                                src={m.url}
                                alt={m.title}
                                className="max-h-full max-w-full object-contain"
                              />
                            )}
                          </div>
                          {m.description && (
                            <p className="text-sm font-base mt-3 whitespace-pre-wrap">
                              {m.description}
                            </p>
                          )}
                        </DialogContent>
                      </Dialog>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
