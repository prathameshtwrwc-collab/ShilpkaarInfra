import type { ProductView } from "@/lib/content";

export type CatalogueItem = Pick<
  ProductView,
  "slug" | "name" | "summary" | "description" | "applications" | "featured" | "order" | "focalX" | "focalY"
> & {
  category: { name: string; slug: string };
  cover: ProductView["cover"];
  index: number; // stable catalogue number (1-based)
};

export function toCatalogueItems(products: ProductView[]): CatalogueItem[] {
  return products.map((p, i) => ({
    slug: p.slug,
    name: p.name,
    summary: p.summary,
    description: p.description,
    applications: p.applications,
    featured: p.featured,
    order: p.order,
    focalX: p.focalX,
    focalY: p.focalY,
    category: p.category,
    cover: p.cover,
    index: i + 1,
  }));
}

export const pad = (n: number) => String(n).padStart(2, "0");
