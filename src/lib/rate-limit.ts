import "server-only";
import { createHash } from "crypto";
import { headers } from "next/headers";
import { db } from "./db";

export async function clientIp() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

export function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${process.env.IP_HASH_SALT ?? ""}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Fixed-window limiter stored in the database. Returns true when the
 * request is allowed.
 */
export async function rateLimit(bucket: string, id: string, limit: number, windowSeconds: number) {
  const key = `${bucket}:${id}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const existing = await db.rateLimit.findUnique({ where: { key } });
  if (!existing || existing.windowStart < windowStart) {
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return true;
  }
  if (existing.count >= limit) return false;
  await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}
