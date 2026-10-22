"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/auth";
import { AdminError, adminAction, slugify } from "@/lib/admin-action";
import { settingSchemas, type SettingKey } from "@/lib/settings-schema";

/* ── Site settings (hero, about, stats, contact, footer …) ── */
export async function saveSetting(key: SettingKey, value: unknown) {
  return adminAction(async (admin) => {
    if (!(key in settingSchemas)) throw new AdminError("Unknown setting.");
    const parsed = settingSchemas[key].parse(value);
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value: JSON.stringify(parsed) },
      update: { value: JSON.stringify(parsed) },
    });
    await logActivity(admin.email, "update", "settings", `Updated ${key} content`);
  }, { message: "Saved and published." });
}

/* ── Services ── */
const serviceSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2).max(60),
  summary: z.string().trim().min(10).max(240),
  detail: z.string().trim().max(600),
  imageId: z.string().nullable(),
  published: z.boolean(),
});
export async function saveService(input: z.infer<typeof serviceSchema>) {
  return adminAction(async (admin) => {
    const d = serviceSchema.parse(input);
    const data = { title: d.title, summary: d.summary, detail: d.detail, imageId: d.imageId, published: d.published };
    if (d.id) await db.service.update({ where: { id: d.id }, data });
    else {
      let slug = slugify(d.title);
      if (await db.service.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
      await db.service.create({ data: { ...data, slug, order: await db.service.count() } });
    }
    await logActivity(admin.email, d.id ? "update" : "create", "service", `${d.id ? "Updated" : "Created"} service ${d.title}`);
  }, { message: "Service saved." });
}
export async function deleteService(id: string) {
  return adminAction(async (admin) => {
    const s = await db.service.delete({ where: { id } });
    await logActivity(admin.email, "delete", "service", `Deleted service ${s.title}`);
  });
}

/* ── Fleet ── */
const fleetSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(60),
  vehicleClass: z.string().trim().min(2).max(60),
  role: z.string().trim().min(5).max(160),
  description: z.string().trim().max(400),
  imageId: z.string().nullable(),
  published: z.boolean(),
});
export async function saveVehicle(input: z.infer<typeof fleetSchema>) {
  return adminAction(async (admin) => {
    const d = fleetSchema.parse(input);
    const data = { name: d.name, vehicleClass: d.vehicleClass, role: d.role, description: d.description, imageId: d.imageId, published: d.published };
    if (d.id) await db.fleetVehicle.update({ where: { id: d.id }, data });
    else await db.fleetVehicle.create({ data: { ...data, order: await db.fleetVehicle.count() } });
    await logActivity(admin.email, d.id ? "update" : "create", "fleet", `${d.id ? "Updated" : "Created"} vehicle ${d.name}`);
  }, { message: "Vehicle saved." });
}
export async function deleteVehicle(id: string) {
  return adminAction(async (admin) => {
    const v = await db.fleetVehicle.delete({ where: { id } });
    await logActivity(admin.email, "delete", "fleet", `Deleted vehicle ${v.name}`);
  });
}

/* ── Simple ordered lists: industries & differentiators ── */
const listSchema = z.array(z.object({ title: z.string().trim().min(2).max(60), body: z.string().trim().max(240) })).max(24);

export async function saveIndustries(items: { title: string; body: string }[]) {
  return adminAction(async (admin) => {
    const list = listSchema.parse(items);
    await db.$transaction([
      db.industry.deleteMany(),
      db.industry.createMany({ data: list.map((i, order) => ({ name: i.title, note: i.body, order })) }),
    ]);
    await logActivity(admin.email, "update", "industries", `Updated industries (${list.length})`);
  }, { message: "Industries saved." });
}

export async function saveDifferentiators(items: { title: string; body: string }[]) {
  return adminAction(async (admin) => {
    const list = listSchema.parse(items);
    if (list.some((i) => !i.body)) throw new AdminError("Each statement needs a description.");
    await db.$transaction([
      db.differentiator.deleteMany(),
      db.differentiator.createMany({ data: list.map((i, order) => ({ title: i.title, body: i.body, order })) }),
    ]);
    await logActivity(admin.email, "update", "why", `Updated Why Shilpkar statements (${list.length})`);
  }, { message: "Statements saved." });
}
