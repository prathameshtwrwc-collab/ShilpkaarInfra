import type { MediaItem } from "@/app/admin/actions/media";

export const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm";
export const MAX_IMAGE_MB = 12;
export const MAX_VIDEO_MB = 80;

export function precheck(file: File): string | null {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) return "Unsupported file type. Upload JPG, PNG, WebP, AVIF, MP4 or WebM.";
  if (isImage && file.size > MAX_IMAGE_MB * 1024 * 1024) return `Images must be ${MAX_IMAGE_MB} MB or smaller.`;
  if (isVideo && file.size > MAX_VIDEO_MB * 1024 * 1024) return `Videos must be ${MAX_VIDEO_MB} MB or smaller.`;
  return null;
}

/** XHR upload so we can report real progress. */
export function uploadFile(file: File, opts: { alt?: string; replaceId?: string; onProgress?: (pct: number) => void }) {
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
      else reject(new Error(body.error ?? (xhr.status === 401 ? "Session expired — sign in again." : "Upload failed.")));
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(fd);
  });
}
