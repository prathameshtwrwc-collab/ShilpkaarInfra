"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/auth";
import { AdminError, adminAction } from "@/lib/admin-action";
import { removeStored } from "@/lib/storage";

export type MediaItem = {
  id: string;
  kind: string;
  url: string;
  alt: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  credit: string | null;
  license: string | null;
  sourceUrl: string | null;
  representative: boolean;
  createdAt: string;
};

export async function listMedia(kind?: "IMAGE" | "VIDEO") {
  return adminAction(
    async () => {
      const rows = await db.media.findMany({ where: kind ? { kind } : {}, orderBy: { createdAt: "desc" }, take: 500 });
      return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) as MediaItem[];
    },
    { revalidate: false },
  );
}

const metaSchema = z.object({
  alt: z.string().trim().max(240),
  credit: z.string().trim().max(160),
  license: z.string().trim().max(60),
  sourceUrl: z.union([z.literal(""), z.url().max(500)]),
  representative: z.boolean(),
});

export async function updateMedia(id: string, input: z.infer<typeof metaSchema>) {
  return adminAction(async (admin) => {
    const d = metaSchema.parse(input);
    await db.media.update({
      where: { id },
      data: { alt: d.alt, credit: d.credit || null, license: d.license || null, sourceUrl: d.sourceUrl || null, representative: d.representative },
    });
    await logActivity(admin.email, "update", "media", `Updated media details`, id);
  }, { message: "Media details saved." });
}

/** Where a media item is referenced, so deletion never silently breaks a page. */
async function usage(id: string) {
  const [covers, gallery, services, fleet, settings] = await Promise.all([
    db.product.findMany({ where: { coverId: id }, select: { name: true } }),
    db.productImage.findMany({ where: { mediaId: id }, select: { product: { select: { name: true } } } }),
    db.service.findMany({ where: { imageId: id }, select: { title: true } }),
    db.fleetVehicle.findMany({ where: { imageId: id }, select: { name: true } }),
    db.siteSetting.findMany({ where: { value: { contains: `"${id}"` } }, select: { key: true } }),
  ]);
  return [
    ...covers.map((c) => `${c.name} (cover)`),
    ...gallery.map((g) => `${g.product.name} (gallery)`),
    ...services.map((s) => `Service: ${s.title}`),
    ...fleet.map((f) => `Fleet: ${f.name}`),
    ...settings.map((s) => `Page content: ${s.key}`),
  ];
}

export async function mediaUsage(id: string) {
  return adminAction(() => usage(id), { revalidate: false });
}

export async function deleteMedia(id: string) {
  return adminAction(async (admin) => {
    const used = await usage(id);
    if (used.length) throw new AdminError(`This file is in use: ${[...new Set(used)].join(", ")}. Replace it there first.`);
    const m = await db.media.delete({ where: { id } });
    if (m.storageKey) await removeStored(m.storageKey).catch((e) => console.error("Storage delete failed", e));
    await logActivity(admin.email, "delete", "media", `Deleted media file`, id);
  }, { message: "File deleted." });
}
