/* Idempotent seed: safe to run repeatedly. Creates catalogue, services,
 * fleet, industries, differentiators and the bundled (licensed) imagery.
 * Existing records are matched by slug/url and only created when missing,
 * so content edited in the admin panel is never overwritten. */
import { PrismaClient } from "@prisma/client";
import { ALT, CATEGORIES, DIFFERENTIATORS, FLEET, INDUSTRIES, PRODUCTS, SEED_MEDIA as manifest, SERVICES, SETTING_MEDIA } from "../src/lib/seed-data";

const db = new PrismaClient();

async function media(key: string) {
  const m = manifest[key];
  if (!m) throw new Error(`Missing seed media ${key}`);
  const existing = await db.media.findFirst({ where: { url: m.url } });
  if (existing) return existing.id;
  const row = await db.media.create({
    data: {
      kind: "IMAGE",
      url: m.url,
      mime: "image/webp",
      size: m.size,
      width: m.width,
      height: m.height,
      alt: ALT[key] ?? "",
      credit: m.credit,
      license: m.license,
      licenseUrl: m.licenseUrl || null,
      sourceUrl: m.sourceUrl,
      representative: true,
    },
  });
  return row.id;
}

async function main() {
  const catIds: Record<string, string> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await db.category.upsert({ where: { slug: c.slug }, create: { ...c, order: i }, update: {} });
    catIds[c.slug] = row.id;
  }

  for (const [i, p] of PRODUCTS.entries()) {
    if (await db.product.findUnique({ where: { slug: p.slug } })) continue;
    const coverId = await media(p.cover);
    const product = await db.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        categoryId: catIds[p.cat],
        summary: p.summary,
        description: p.description,
        applications: JSON.stringify(p.applications),
        featured: !!p.featured,
        order: i,
        coverId,
        focalX: p.focal?.[0] ?? 50,
        focalY: p.focal?.[1] ?? 50,
      },
    });
    for (const [j, g] of [p.cover, ...(p.gallery ?? [])].entries()) {
      await db.productImage.create({ data: { productId: product.id, mediaId: await media(g), order: j } });
    }
  }

  for (const [i, s] of SERVICES.entries()) {
    if (await db.service.findUnique({ where: { slug: s.slug } })) continue;
    await db.service.create({
      data: { slug: s.slug, title: s.title, summary: s.summary, detail: s.detail, order: i, imageId: await media(s.image) },
    });
  }

  if ((await db.fleetVehicle.count()) === 0) {
    for (const [i, f] of FLEET.entries()) {
      await db.fleetVehicle.create({
        data: {
          name: f.name,
          vehicleClass: f.vehicleClass,
          role: f.role,
          description: f.description,
          order: i,
          imageId: f.image ? await media(f.image) : null,
        },
      });
    }
  }

  if ((await db.industry.count()) === 0) {
    await db.industry.createMany({ data: INDUSTRIES.map(([name, note], order) => ({ name, note, order })) });
  }
  if ((await db.differentiator.count()) === 0) {
    await db.differentiator.createMany({ data: DIFFERENTIATORS.map(([title, body], order) => ({ title, body, order })) });
  }

  // Page imagery lives in settings; only set when not already configured.
  const { SETTING_DEFAULTS } = await import("../src/lib/settings-schema");
  for (const [key, fields] of Object.entries(SETTING_MEDIA)) {
    if (await db.siteSetting.findUnique({ where: { key } })) continue;
    const value = { ...(SETTING_DEFAULTS as Record<string, object>)[key] } as Record<string, unknown>;
    for (const [field, mediaKey] of Object.entries(fields)) value[field] = await media(mediaKey);
    await db.siteSetting.create({ data: { key, value: JSON.stringify(value) } });
  }

  // Remaining bundled images go into the media library for reuse.
  for (const key of Object.keys(manifest)) await media(key);

  console.log("Seed complete:", {
    products: await db.product.count(),
    services: await db.service.count(),
    fleet: await db.fleetVehicle.count(),
    media: await db.media.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
