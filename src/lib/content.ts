import "server-only";
import { cache } from "react";
import { db } from "./db";
import { SETTING_DEFAULTS, settingSchemas, type SettingKey, type Settings } from "./settings-schema";

export type MediaView = {
  id: string;
  url: string;
  alt: string;
  kind: string;
  width: number | null;
  height: number | null;
  credit: string | null;
  license: string | null;
  sourceUrl: string | null;
  representative: boolean;
};

const mediaSelect = {
  id: true,
  url: true,
  alt: true,
  kind: true,
  width: true,
  height: true,
  credit: true,
  license: true,
  sourceUrl: true,
  representative: true,
} as const;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.siteSetting.findMany();
  const out = structuredClone(SETTING_DEFAULTS) as Settings;
  for (const row of rows) {
    const key = row.key as SettingKey;
    if (!(key in settingSchemas)) continue;
    try {
      const parsed = settingSchemas[key].safeParse(JSON.parse(row.value));
      if (parsed.success) (out as Record<string, unknown>)[key] = parsed.data;
    } catch {
      // keep default on malformed JSON
    }
  }
  return out;
});

export const getMediaMap = cache(async (ids: (string | null | undefined)[]) => {
  const list = ids.filter((x): x is string => !!x);
  if (!list.length) return new Map<string, MediaView>();
  const rows = await db.media.findMany({ where: { id: { in: list } }, select: mediaSelect });
  return new Map(rows.map((r) => [r.id, r]));
});

const productInclude = {
  category: true,
  cover: { select: mediaSelect },
  images: { orderBy: { order: "asc" as const }, include: { media: { select: mediaSelect } } },
};

export type ProductView = {
  id: string;
  slug: string;
  name: string;
  category: { name: string; slug: string };
  summary: string;
  description: string;
  applications: string[];
  quoteNote: string;
  featured: boolean;
  published: boolean;
  order: number;
  focalX: number;
  focalY: number;
  cover: MediaView | null;
  gallery: MediaView[];
};

function toProductView(p: Awaited<ReturnType<typeof fetchProducts>>[number]): ProductView {
  let applications: string[] = [];
  try {
    const parsed = JSON.parse(p.applications);
    if (Array.isArray(parsed)) applications = parsed.map(String);
  } catch {}
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: { name: p.category.name, slug: p.category.slug },
    summary: p.summary,
    description: p.description,
    applications,
    quoteNote: p.quoteNote,
    featured: p.featured,
    published: p.published,
    order: p.order,
    focalX: p.focalX,
    focalY: p.focalY,
    cover: p.cover,
    gallery: p.images.map((i) => i.media),
  };
}

function fetchProducts(includeUnpublished = false) {
  return db.product.findMany({
    where: includeUnpublished ? {} : { published: true },
    include: productInclude,
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

export const getProducts = cache(async () => (await fetchProducts()).map(toProductView));

export async function getProductBySlug(slug: string, includeUnpublished = false) {
  const p = await db.product.findUnique({ where: { slug }, include: productInclude });
  if (!p || (!p.published && !includeUnpublished)) return null;
  return toProductView(p);
}

/** Categories that currently have at least one published product. */
export const getCategories = cache(async () => {
  const cats = await db.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: { where: { published: true } } } } },
  });
  return cats.filter((c) => c._count.products > 0).map((c) => ({ name: c.name, slug: c.slug, count: c._count.products }));
});

export const getServices = cache(async () =>
  db.service.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: { image: { select: mediaSelect } },
  }),
);

export const getFleet = cache(async () =>
  db.fleetVehicle.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: { image: { select: mediaSelect } },
  }),
);

export const getIndustries = cache(async () => db.industry.findMany({ orderBy: { order: "asc" } }));
export const getDifferentiators = cache(async () => db.differentiator.findMany({ orderBy: { order: "asc" } }));

/** Material options for the quote form (published products only). */
export const getMaterialOptions = cache(async () => {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug, name: p.name, category: p.category.name }));
});

export type ServiceView = Awaited<ReturnType<typeof getServices>>[number];
export type FleetView = Awaited<ReturnType<typeof getFleet>>[number];
