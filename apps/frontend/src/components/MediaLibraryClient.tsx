"use client";
import { UploadForm } from "./UploadForm";
import { MediaGrid } from "./MediaGrid";
import { useMedia } from "../hooks/useMedia";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export function MediaLibraryClient() {
  const { user, logout, loading: authLoading } = useAuth();
  const { items, loading, error, setItems, refresh, reset } = useMedia(
    !!user && !authLoading
  );

  if (authLoading) {
    return <p className="text-sm opacity-70">Loading session...</p>;
  }

  if (!user) {
    return (
      <Card className="max-w-xl border-dashed bg-secondary-background/60 mx-auto">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-heading">
              Welcome to your Media Library
            </h2>
            <p className="text-sm leading-relaxed opacity-80">
              Sign in (or create an account) to start uploading images & videos,
              organize them, and stream media directly from the browser.
            </p>
          </div>
          <ul className="text-xs tracking-wide uppercase grid gap-2 sm:grid-cols-2">
            <li className="px-3 py-2 rounded-base border-2 border-border bg-secondary-background shadow-shadow">
              Secure Uploads
            </li>
            <li className="px-3 py-2 rounded-base border-2 border-border bg-secondary-background shadow-shadow">
              Personal Library
            </li>
            <li className="px-3 py-2 rounded-base border-2 border-border bg-secondary-background shadow-shadow">
              Image & Video Support
            </li>
            <li className="px-3 py-2 rounded-base border-2 border-border bg-secondary-background shadow-shadow">
              Streaming Playback
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button asChild className="min-w-40">
              <a href="/login">Login</a>
            </Button>
            <Button variant="neutral" asChild className="min-w-40">
              <a href="/register">Create Account</a>
            </Button>
          </div>
          <p className="text-[10px] opacity-60">
            Your credentials are stored securely; tokens live only in this
            browser session.
          </p>
        </CardContent>
      </Card>
    );
  }

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
              <Button
                type="button"
                variant="neutral"
                onClick={() => {
                  logout();
                  reset();
                }}
                className="min-w-24"
              >
                Logout
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
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
