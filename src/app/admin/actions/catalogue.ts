"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/auth";
import { AdminError, adminAction, slugify } from "@/lib/admin-action";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).optional(),
  categoryId: z.string().trim().optional(),
  newCategory: z.string().trim().max(40).optional(),
  summary: z.string().trim().min(10).max(240),
  description: z.string().trim().min(10).max(2000),
  applications: z.array(z.string().trim().min(1).max(60)).max(12),
  quoteNote: z.string().trim().min(5).max(300),
  featured: z.boolean(),
  published: z.boolean(),
  coverId: z.string().nullable(),
  galleryIds: z.array(z.string()).max(12),
  focalX: z.number().int().min(0).max(100),
  focalY: z.number().int().min(0).max(100),
});
export type ProductInput = z.infer<typeof productSchema>;

async function resolveCategory(categoryId?: string, newCategory?: string) {
  if (newCategory) {
    const slug = slugify(newCategory);
    if (!slug) throw new AdminError("Enter a valid category name.");
    const max = await db.category.aggregate({ _max: { order: true } });
    const cat = await db.category.upsert({
      where: { slug },
      create: { name: newCategory, slug, order: (max._max.order ?? 0) + 1 },
      update: {},
    });
    return cat.id;
  }
  if (!categoryId || !(await db.category.findUnique({ where: { id: categoryId } }))) throw new AdminError("Choose a category.");
  return categoryId;
}

export async function saveProduct(input: ProductInput) {
  return adminAction(async (admin) => {
    const d = productSchema.parse(input);
    const slug = slugify(d.slug || d.name);
    if (!slug) throw new AdminError("Slug is required.");
    const clash = await db.product.findUnique({ where: { slug } });
    if (clash && clash.id !== d.id) throw new AdminError(`The URL “/products/${slug}” is already used by ${clash.name}.`);
    const categoryId = await resolveCategory(d.categoryId, d.newCategory);

    const data = {
      name: d.name,
      slug,
      categoryId,
      summary: d.summary,
      description: d.description,
      applications: JSON.stringify(d.applications),
      quoteNote: d.quoteNote,
      featured: d.featured,
      published: d.published,
      coverId: d.coverId,
      focalX: d.focalX,
      focalY: d.focalY,
    };
    const gallery = [...new Set(d.coverId ? [d.coverId, ...d.galleryIds] : d.galleryIds)];

    const product = await db.$transaction(async (tx) => {
      const p = d.id
        ? await tx.product.update({ where: { id: d.id }, data })
        : await tx.product.create({ data: { ...data, order: ((await tx.product.aggregate({ _max: { order: true } }))._max.order ?? 0) + 1 } });
      await tx.productImage.deleteMany({ where: { productId: p.id } });
      if (gallery.length) await tx.productImage.createMany({ data: gallery.map((mediaId, order) => ({ productId: p.id, mediaId, order })) });
      return p;
    });
    await logActivity(admin.email, d.id ? "update" : "create", "product", `${d.id ? "Updated" : "Created"} product ${product.name}`, product.id);
    return { id: product.id, slug: product.slug };
  }, { message: "Product saved." });
}

export async function deleteProduct(id: string) {
  return adminAction(async (admin) => {
    const p = await db.product.findUnique({ where: { id } });
    if (!p) throw new AdminError("Product not found.");
    // Enquiries keep their materialName snapshot; productId is set null by the schema.
    await db.product.delete({ where: { id } });
    await logActivity(admin.email, "delete", "product", `Deleted product ${p.name}`, id);
  }, { message: "Product deleted. Existing enquiries keep the material name." });
}

export async function setProductFlag(id: string, flag: "published" | "featured", value: boolean) {
  return adminAction(async (admin) => {
    const p = await db.product.update({ where: { id }, data: { [flag]: value } });
    await logActivity(admin.email, "update", "product", `${p.name}: ${flag} → ${value ? "on" : "off"}`, id);
  });
}

/** Persists a full ordering (array of ids, top to bottom). */
export async function reorder(entity: "product" | "fleet" | "service" | "category", ids: string[]) {
  return adminAction(async (admin) => {
    z.array(z.string()).max(200).parse(ids);
    await db.$transaction(
      ids.map((id, order) => {
        if (entity === "product") return db.product.update({ where: { id }, data: { order } });
        if (entity === "fleet") return db.fleetVehicle.update({ where: { id }, data: { order } });
        if (entity === "service") return db.service.update({ where: { id }, data: { order } });
        return db.category.update({ where: { id }, data: { order } });
      }),
    );
    await logActivity(admin.email, "reorder", entity, `Reordered ${entity === "fleet" ? "fleet" : `${entity}s`}`);
  });
}

export async function saveCategory(input: { id?: string; name: string }) {
  return adminAction(async (admin) => {
    const name = z.string().trim().min(2).max(40).parse(input.name);
    const slug = slugify(name);
    const clash = await db.category.findUnique({ where: { slug } });
    if (clash && clash.id !== input.id) throw new AdminError("A category with that name already exists.");
    if (input.id) await db.category.update({ where: { id: input.id }, data: { name, slug } });
    else await db.category.create({ data: { name, slug, order: (await db.category.count()) + 1 } });
    await logActivity(admin.email, input.id ? "update" : "create", "category", `Category ${name}`);
  });
}

export async function deleteCategory(id: string) {
  return adminAction(async (admin) => {
    const count = await db.product.count({ where: { categoryId: id } });
    if (count) throw new AdminError(`Move or delete the ${count} product(s) in this category first.`);
    const c = await db.category.delete({ where: { id } });
    await logActivity(admin.email, "delete", "category", `Deleted category ${c.name}`);
  });
}
