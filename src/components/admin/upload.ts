import type { MediaItem } from "@/app/admin/actions/media";

export const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm";
export const MAX_IMAGE_MB = 12;
export const MAX_VIDEO_MB = 80;

/** Serverless hosts (Vercel) cap request bodies at 4.5 MB; stay safely below. */
const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

export function precheck(file: File): string | null {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) return "Unsupported file type. Upload JPG, PNG, WebP, AVIF, MP4 or WebM.";
  if (isImage && file.size > MAX_IMAGE_MB * 1024 * 1024) return `Images must be ${MAX_IMAGE_MB} MB or smaller.`;
  if (isVideo && file.size > MAX_VIDEO_MB * 1024 * 1024) return `Videos must be ${MAX_VIDEO_MB} MB or smaller.`;
  return null;
}

/**
 * Shrinks large photos in the browser (max 2560px, WebP) so they fit the
 * request limit. The server still re-encodes every image with sharp.
 */
async function prepareImage(file: File): Promise<File> {
  if (file.size <= MAX_REQUEST_BYTES && file.size <= 2.5 * 1024 * 1024) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // let the server report an unreadable image
  }
  const scale = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const q of [0.9, 0.82, 0.72, 0.6]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", q));
    if (blob && blob.size <= MAX_REQUEST_BYTES) return new File([blob], file.name.replace(/\.\w+$/, ".webp"), { type: "image/webp" });
  }
  throw new Error("This image is too large to upload even after compression. Try a smaller photo.");
}

let directSupport: Promise<boolean> | null = null;
function canUploadDirect() {
  directSupport ??= fetch("/api/admin/media/direct")
    .then((r) => (r.ok ? r.json() : { direct: false }))
    .then((j: { direct?: boolean }) => !!j.direct)
    .catch(() => false);
  return directSupport;
}

/** Browser → Vercel Blob upload for videos, then server-side verification. */
async function uploadVideoDirect(file: File, opts: { alt?: string; replaceId?: string; onProgress?: (pct: number) => void }) {
  const { upload } = await import("@vercel/blob/client");
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-").slice(-80);
  const blob = await upload(`videos/${safe}`, file, {
    access: "public",
    handleUploadUrl: "/api/admin/media/direct",
    contentType: file.type,
    onUploadProgress: ({ percentage }) => opts.onProgress?.(Math.min(99, Math.round(percentage))),
  });
  const res = await fetch("/api/admin/media/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: blob.url, alt: opts.alt, replaceId: opts.replaceId }),
  });
  const body = (await res.json().catch(() => ({}))) as { media?: MediaItem; error?: string };
  if (!res.ok || !body.media) throw new Error(body.error ?? "Upload failed.");
  opts.onProgress?.(100);
  return body.media;
}

/** XHR upload so we can report real progress. */
function uploadViaServer(file: File, opts: { alt?: string; replaceId?: string; onProgress?: (pct: number) => void }) {
  return new Promise<MediaItem>((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    if (opts.alt) fd.append("alt", opts.alt);
    if (opts.replaceId) fd.append("replaceId", opts.replaceId);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body: { media?: MediaItem; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body.media) resolve(body.media);
      else
        reject(
          new Error(
            body.error ??
              (xhr.status === 401 ? "Session expired — sign in again." : xhr.status === 413 ? "File is too large for the server." : "Upload failed."),
          ),
        );
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(fd);
  });
}

export async function uploadFile(file: File, opts: { alt?: string; replaceId?: string; onProgress?: (pct: number) => void }) {
  if (file.type.startsWith("video/")) {
    if (await canUploadDirect()) return uploadVideoDirect(file, opts);
    if (file.size > MAX_REQUEST_BYTES && location.hostname !== "localhost") {
      throw new Error("Videos over 4 MB need a connected Vercel Blob store (Vercel → Storage → Blob).");
    }
    return uploadViaServer(file, opts);
  }
  return uploadViaServer(await prepareImage(file), opts);
}
