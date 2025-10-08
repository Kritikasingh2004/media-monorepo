import { MediaLibraryClient } from "../components/MediaLibraryClient";

// Server Component (no client hooks directly here)
export default async function Home() {
  return (
    <main className="mx-auto max-w-7xl p-6 md:p-10 space-y-14">
      <section className="relative">
        <div className="rounded-base border-2 border-border bg-main text-main-foreground shadow-shadow px-6 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8 overflow-hidden">
          <div className="space-y-4 max-w-xl z-10">
            <h1 className="text-4xl md:text-5xl font-heading leading-tight">
              Media Library
            </h1>
            <p className="text-sm md:text-base font-base opacity-90 max-w-prose">
              Upload, preview, and manage images & videos with instant previews
              and fast, reliable uploads.
            </p>
            <div className="flex gap-4 pt-2 text-[10px] uppercase tracking-wide">
              <span className="px-3 py-1 rounded-base border-2 border-border bg-secondary-background shadow-shadow">
                Fast Uploads
              </span>
              <span className="px-3 py-1 rounded-base border-2 border-border bg-secondary-background shadow-shadow">
                Live Preview
              </span>
              <span className="px-3 py-1 rounded-base border-2 border-border bg-secondary-background shadow-shadow">
                Video & Images
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 opacity-40 md:opacity-60 pointer-events-none select-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 w-24 rounded-base border-2 border-border bg-secondary-background shadow-shadow"
              />
            ))}
          </div>
        </div>
      </section>
      <MediaLibraryClient />
    </main>
  );
}
