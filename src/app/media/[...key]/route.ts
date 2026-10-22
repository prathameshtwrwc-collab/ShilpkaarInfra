import { promises as fs } from "fs";
import path from "path";
import { LOCAL_ROOT } from "@/lib/storage";

// Serves locally stored uploads (STORAGE_DRIVER=local). With S3, media URLs
// point straight at the bucket / CDN and this route is unused.
const TYPES: Record<string, string> = { ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm" };

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  if (key.some((p) => p === ".." || p.includes("\\") || p.startsWith("."))) {
    return new Response("Not found", { status: 404 });
  }
  const file = path.join(LOCAL_ROOT, ...key);
  if (!file.startsWith(LOCAL_ROOT + path.sep)) return new Response("Not found", { status: 404 });
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(file);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
