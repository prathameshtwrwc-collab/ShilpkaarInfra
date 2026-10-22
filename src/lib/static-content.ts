import "server-only";
import { ALT, CATEGORIES, DIFFERENTIATORS, FLEET, INDUSTRIES, PRODUCTS, SEED_MEDIA, SERVICES, SETTING_MEDIA } from "./seed-data";
import { SETTING_DEFAULTS, type Settings } from "./settings-schema";
import type { MediaView, ProductView } from "./content";

/*
 * Showcase mode: when no database is configured the public site is served
 * from the bundled content below (the same data the seed would insert).
 * IDs are the stable seed keys, so links and media lookups stay consistent.
 */

const EPOCH = new Date("2026-10-23T00:00:00Z");

export function staticMedia(key: string | null | undefined): MediaView | null {
  if (!key) return null;
  const m = SEED_MEDIA[key];
  if (!m) return null;
  return {
    id: key,
    url: m.url,
    alt: ALT[key] ?? "",
    kind: "IMAGE",
    width: m.width,
    height: m.height,
    credit: m.credit,
    license: m.license,
    sourceUrl: m.sourceUrl,
    representative: true,
  };
}

export function staticSettings(): Settings {
  const s = structuredClone(SETTING_DEFAULTS) as Settings;
  for (const [key, fields] of Object.entries(SETTING_MEDIA)) {
    Object.assign((s as Record<string, object>)[key], fields);
  }
  return s;
}

export function staticProducts(): ProductView[] {
  const cats = new Map(CATEGORIES.map((c) => [c.slug, c]));
  return PRODUCTS.map((p, i) => {
    const cat = cats.get(p.cat)!;
    return {
      id: p.slug,
      slug: p.slug,
      name: p.name,
      category: { name: cat.name, slug: cat.slug },
      summary: p.summary,
      description: p.description,
      applications: p.applications,
      quoteNote: "Pricing is quoted per project, based on quantity, grade and delivery location.",
      featured: !!p.featured,
      published: true,
      order: i,
      focalX: p.focal?.[0] ?? 50,
      focalY: p.focal?.[1] ?? 50,
      cover: staticMedia(p.cover),
      gallery: [p.cover, ...(p.gallery ?? [])].map(staticMedia).filter((m): m is MediaView => !!m),
    };
  });
}

export function staticCategories() {
  const products = staticProducts();
  return CATEGORIES.map((c) => ({ name: c.name, slug: c.slug, count: products.filter((p) => p.category.slug === c.slug).length })).filter(
    (c) => c.count > 0,
  );
}

export function staticServices() {
  return SERVICES.map((s, i) => ({
    id: s.slug,
    slug: s.slug,
    title: s.title,
    summary: s.summary,
    detail: s.detail,
    order: i,
    published: true,
    imageId: s.image,
    updatedAt: EPOCH,
    image: staticMedia(s.image),
  }));
}

export function staticFleet() {
  return FLEET.map((f, i) => ({
    id: `fleet-${i}`,
    name: f.name,
    vehicleClass: f.vehicleClass,
    role: f.role,
    description: f.description,
    order: i,
    published: true,
    imageId: f.image,
    updatedAt: EPOCH,
    image: staticMedia(f.image),
  }));
}

export function staticIndustries() {
  return INDUSTRIES.map(([name, note], order) => ({ id: `industry-${order}`, name, note, order }));
}

export function staticDifferentiators() {
  return DIFFERENTIATORS.map(([title, body], order) => ({ id: `why-${order}`, title, body, order }));
}

export function staticCredits() {
  return Object.keys(SEED_MEDIA)
    .map(staticMedia)
    .filter((m): m is MediaView => !!m)
    .map((m) => ({ ...m, licenseUrl: SEED_MEDIA[m.id].licenseUrl || null }));
}
