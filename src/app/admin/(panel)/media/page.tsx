import { db } from "@/lib/db";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { storageDriver } from "@/lib/storage";

export default async function AdminMedia() {
  const rows = await db.media.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  const driver = storageDriver();
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="display text-5xl md:text-6xl">Media library</h1>
      <p className="mt-2 text-sm text-ink/70">
        Images and videos used across the website. Storage: <strong>{driver === "blob" ? "Vercel Blob" : driver === "s3" ? "S3-compatible object storage" : "local disk (development)"}</strong>.
      </p>
      {driver === "local" && process.env.NODE_ENV === "production" && (
        <p className="mt-3 border-l-4 border-danger bg-white px-4 py-3 text-sm">
          No cloud storage is connected, so uploads are disabled on Vercel. Connect a Blob store in Vercel → Storage, or configure STORAGE_DRIVER=s3.
        </p>
      )}
      <div className="mt-8">
        <MediaLibrary items={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />
      </div>
    </div>
  );
}
