"use client";
import { MediaItem } from "@media/contracts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
                  {items.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-base border-2 border-border bg-secondary-background shadow-shadow flex flex-col overflow-hidden hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-transform"
                    >
                      <div className="aspect-video w-full bg-black/10 flex items-center justify-center overflow-hidden border-b-2 border-border">
                        {m.type === "video" ? (
                          <video
                            src={m.url}
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={m.thumbnailUrl || m.url}
                            alt={m.title}
                            className="w-full h-full object-cover"
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
                          {m.size ? ` • ${(m.size / 1024).toFixed(1)} KB` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
