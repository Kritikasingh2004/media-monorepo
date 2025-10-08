"use client";
import { useRef, useState } from "react";
import { uploadMedia } from "../lib/api";
import { MediaItem } from "@media/contracts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { X, Upload, File as FileIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onUploaded: (item: MediaItem) => void;
}

const MAX_BYTES = 50 * 1024 * 1024;
const schema = z.object({
  title: z.string().max(200, "Title too long").optional(),
  description: z.string().max(2000, "Description too long").optional(),
  file: z
    .instanceof(File)
    .or(z.null())
    .refine((f) => f instanceof File, "Choose a file")
    .refine(
      (f) => !f || /^image\//.test(f.type) || /^video\//.test(f.type),
      "Only image or video files are allowed"
    )
    .refine(
      (f) => !f || f.size <= MAX_BYTES,
      `File must be <= ${(MAX_BYTES / (1024 * 1024)).toFixed(0)}MB`
    ),
});

type FormValues = z.infer<typeof schema>;

export function UploadForm({ onUploaded }: Props) {
  const [progress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", file: null },
    mode: "onSubmit",
  });

  async function onSubmit(values: FormValues) {
    if (!values.file) return; // schema guard
    setSubmitting(true);
    const uploadToastId = toast.loading("Uploading…", {
      description: values.title || values.file.name,
    });
    try {
      const item = await uploadMedia({
        title: values.title?.trim() || values.file.name,
        description: values.description?.trim() || undefined,
        file: values.file,
        onProgress: (p) => setProgress(p),
      });
      onUploaded(item);
      toast.success("Upload complete", {
        id: uploadToastId,
        description: item.title,
      });
      setProgress(null);
      form.reset({ title: "", description: "", file: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
      requestAnimationFrame(() => {
        const titleEl = document.getElementById("title");
        if (titleEl instanceof HTMLInputElement) titleEl.focus();
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error("Upload failed", { id: uploadToastId, description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  const watchedFile = form.watch("file");

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-xl">Upload Media</CardTitle>
        <CardDescription>
          Store an image or video with an optional description.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input id="title" placeholder="My file title" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional. Defaults to file name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <textarea
                      id="description"
                      className={cn(
                        "min-h-24 resize-y rounded-base border-2 border-border bg-secondary-background selection:bg-main selection:text-main-foreground px-3 py-2 text-sm font-base text-foreground placeholder:text-foreground/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                      )}
                      placeholder="Optional description"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Up to 2000 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <div
                      className={cn(
                        "group rounded-base border-2 border-dashed border-border bg-secondary-background/70 p-4 shadow-shadow transition-all",
                        field.value && "border-solid bg-secondary-background"
                      )}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          if (f) {
                            const typeOk =
                              /^image\//.test(f.type) ||
                              /^video\//.test(f.type);
                            const sizeOk = f.size <= MAX_BYTES;
                            if (!typeOk || !sizeOk) {
                              toast.error(
                                !typeOk
                                  ? "Only image or video files are allowed"
                                  : `File exceeds ${(
                                      MAX_BYTES /
                                      (1024 * 1024)
                                    ).toFixed(0)}MB limit`
                              );
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
                              field.onChange(null);
                              return;
                            }
                          }
                          field.onChange(f);
                        }}
                      />
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant={field.value ? "neutral" : "default"}
                            onClick={() => fileInputRef.current?.click()}
                            className="min-w-32"
                          >
                            <Upload className="size-4" />
                            {field.value ? "Change" : "Select"}
                          </Button>
                          {field.value && (
                            <Button
                              type="button"
                              variant="neutral"
                              onClick={() => {
                                field.onChange(null);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }}
                              className="px-2"
                            >
                              <X className="size-4" />
                            </Button>
                          )}
                          <p className="text-xs opacity-70 flex-1">
                            {field.value
                              ? field.value.name
                              : "Choose an image or video file"}
                          </p>
                        </div>
                        {field.value && (
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide opacity-70">
                            <FileIcon className="size-4" />
                            <span>
                              {(field.value.size / 1024).toFixed(1)} KB •{" "}
                              {field.value.type || "unknown"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {progress !== null && (
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 flex-1 overflow-hidden relative">
                  <div
                    className="absolute left-0 top-0 h-full bg-main-foreground/40"
                    style={{ width: `${progress}%` }}
                  />
                </Skeleton>
                <span className="text-xs font-medium w-10 tabular-nums">
                  {progress}%
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="min-w-32">
                {submitting ? "Uploading..." : "Upload"}
              </Button>
              <Button
                type="button"
                variant="neutral"
                disabled={submitting && !!watchedFile}
                onClick={() => {
                  form.reset({ title: "", description: "", file: null });
                  setProgress(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-[10px] uppercase tracking-wide opacity-70 flex flex-wrap gap-4">
        <span>Only images/videos. Max 50MB.</span>
      </CardFooter>
    </Card>
  );
}
