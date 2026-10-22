import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { head, del } from "@vercel/blob";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdmin, logActivity } from "@/lib/auth";
import { isSameOrigin } from "@/lib/same-origin";
import { MAX_VIDEO_BYTES, removeStored, sniff, storageDriver, VIDEO_TYPES } from "@/lib/storage";

export const runtime = "nodejs";

const schema = z.object({
  url: z.url().max(1000),
  alt: z.string().trim().max(240).optional(),
  replaceId: z.string().max(40).optional(),
});

/** Registers a video that the browser uploaded directly to Vercel Blob. */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (storageDriver() !== "blob") return NextResponse.json({ error: "Direct uploads are not available." }, { status: 409 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { url, alt = "", replaceId } = parsed.data;

  // Must be a file in *our* Blob store, and genuinely a video.
  if (!new URL(url).hostname.endsWith(".public.blob.vercel-storage.com")) {
    return NextResponse.json({ error: "Unknown file location." }, { status: 400 });
  }
  let info;
  try {
    info = await head(url);
  } catch {
    return NextResponse.json({ error: "Uploaded file not found." }, { status: 404 });
  }
  const firstBytes = Buffer.from(await (await fetch(url, { headers: { Range: "bytes=0-31" } })).arrayBuffer());
  const mime = sniff(firstBytes);
  if (!mime || !(VIDEO_TYPES as readonly string[]).includes(mime) || info.size > MAX_VIDEO_BYTES) {
    await del(url).catch(() => {});
    return NextResponse.json({ error: "Only MP4 or WebM videos up to 80 MB are allowed." }, { status: 415 });
  }

  const data = { kind: "VIDEO", url: info.url, storageKey: info.pathname, mime, size: info.size, width: null, height: null };
  let media;
  if (replaceId) {
    const old = await db.media.findUnique({ where: { id: replaceId } });
    if (!old) return NextResponse.json({ error: "File to replace was not found." }, { status: 404 });
    media = await db.media.update({
      where: { id: replaceId },
      data: { ...data, alt: alt || old.alt, credit: null, license: null, sourceUrl: null, licenseUrl: null, representative: false },
    });
    if (old.storageKey) await removeStored(old.storageKey).catch(() => {});
    await logActivity(admin.email, "replace", "media", "Replaced video file", media.id);
  } else {
    media = await db.media.create({ data: { ...data, alt } });
    await logActivity(admin.email, "upload", "media", `Uploaded video (${Math.round(info.size / 1024)} KB)`, media.id);
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ media: { ...media, createdAt: media.createdAt.toISOString() } });
}
