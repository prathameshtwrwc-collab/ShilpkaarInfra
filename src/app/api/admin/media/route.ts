import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAdmin, logActivity } from "@/lib/auth";
import { isSameOrigin } from "@/lib/same-origin";
import { MAX_VIDEO_BYTES, storeUpload, UploadError, removeStored } from "@/lib/storage";

export const runtime = "nodejs";

/** Upload (and optionally replace) a media file. multipart/form-data: file, alt, replaceId? */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_VIDEO_BYTES + 1024 * 1024) return NextResponse.json({ error: "File is too large." }, { status: 413 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  const alt = String(form.get("alt") ?? "").trim().slice(0, 240);
  const replaceId = String(form.get("replaceId") ?? "") || null;

  try {
    const stored = await storeUpload(Buffer.from(await file.arrayBuffer()));
    const data = {
      kind: stored.mime.startsWith("video/") ? "VIDEO" : "IMAGE",
      url: stored.url,
      storageKey: stored.key,
      mime: stored.mime,
      size: stored.size,
      width: stored.width ?? null,
      height: stored.height ?? null,
    };

    let media;
    if (replaceId) {
      // Replace keeps the same id, so every page using it updates at once.
      const old = await db.media.findUnique({ where: { id: replaceId } });
      if (!old) return NextResponse.json({ error: "File to replace was not found." }, { status: 404 });
      media = await db.media.update({
        where: { id: replaceId },
        data: { ...data, alt: alt || old.alt, credit: null, license: null, sourceUrl: null, licenseUrl: null, representative: false },
      });
      if (old.storageKey) await removeStored(old.storageKey).catch(() => {});
      await logActivity(admin.email, "replace", "media", `Replaced ${data.kind.toLowerCase()} file`, media.id);
    } else {
      media = await db.media.create({ data: { ...data, alt } });
      await logActivity(admin.email, "upload", "media", `Uploaded ${data.kind.toLowerCase()} (${Math.round(stored.size / 1024)} KB)`, media.id);
    }
    revalidatePath("/", "layout");
    return NextResponse.json({ media: { ...media, createdAt: media.createdAt.toISOString() } });
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ error: e.message }, { status: 415 });
    console.error("Upload failed", e);
    return NextResponse.json({ error: "Upload failed. Check storage configuration and try again." }, { status: 500 });
  }
}
