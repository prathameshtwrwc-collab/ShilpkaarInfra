import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

/**
 * Media storage. "local" writes to ./storage/uploads and is served by the
 * /media route — only suitable where the disk persists (dev, VPS). Use "s3"
 * (AWS S3, Cloudflare R2, MinIO…) on serverless / ephemeral hosts.
 */

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

export const LOCAL_ROOT = path.join(process.cwd(), "storage", "uploads");

type Stored = { key: string; url: string; mime: string; size: number; width?: number; height?: number };

/** Detect the real file type from magic bytes — never trust the client's mime. */
export function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
    return "video/mp4";
  }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "video/webm";
  return null;
}

async function put(key: string, body: Buffer, mime: string): Promise<string> {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "s3") {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const bucket = process.env.S3_BUCKET;
    const publicUrl = process.env.S3_PUBLIC_URL;
    if (!bucket || !publicUrl) throw new Error("S3_BUCKET and S3_PUBLIC_URL must be configured.");
    const client = new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: mime,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${publicUrl.replace(/\/$/, "")}/${key}`;
  }
  const file = path.join(LOCAL_ROOT, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body);
  return `/media/${key}`;
}

export async function removeStored(key: string) {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "s3") {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
    await client.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    return;
  }
  const file = path.join(LOCAL_ROOT, key);
  if (!file.startsWith(LOCAL_ROOT)) return;
  await fs.rm(file, { force: true });
}

export class UploadError extends Error {}

/**
 * Validates and stores an upload. Images are re-encoded through sharp, which
 * strips metadata/EXIF and neutralises malformed or polyglot files.
 */
export async function storeUpload(buf: Buffer): Promise<Stored> {
  const mime = sniff(buf);
  const month = new Date().toISOString().slice(0, 7);

  if (mime && (IMAGE_TYPES as readonly string[]).includes(mime)) {
    if (buf.length > MAX_IMAGE_BYTES) throw new UploadError("Images must be 12 MB or smaller.");
    let out: Buffer;
    let info: { width: number; height: number };
    try {
      ({ data: out, info } = await sharp(buf, { limitInputPixels: 80_000_000 })
        .rotate()
        .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true }));
    } catch {
      throw new UploadError("That image could not be read. Please upload a valid JPG, PNG, WebP or AVIF file.");
    }
    const key = `${month}/${randomUUID()}.webp`;
    const url = await put(key, out, "image/webp");
    return { key, url, mime: "image/webp", size: out.length, width: info.width, height: info.height };
  }

  if (mime && (VIDEO_TYPES as readonly string[]).includes(mime)) {
    if (buf.length > MAX_VIDEO_BYTES) throw new UploadError("Videos must be 80 MB or smaller.");
    const ext = mime === "video/webm" ? "webm" : "mp4";
    const key = `${month}/${randomUUID()}.${ext}`;
    const url = await put(key, buf, mime);
    return { key, url, mime, size: buf.length };
  }

  throw new UploadError("Unsupported file type. Upload JPG, PNG, WebP, AVIF, MP4 or WebM.");
}
