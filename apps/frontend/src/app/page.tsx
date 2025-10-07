import { MediaLibraryClient } from "../components/MediaLibraryClient";

// Server Component (no client hooks directly here)
export default async function Home() {
  return (
    <main className="mx-auto max-w-6xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Media Library</h1>
      <MediaLibraryClient />
    </main>
  );
}
