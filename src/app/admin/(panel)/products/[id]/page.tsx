import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { cover: true, images: { orderBy: { order: "asc" }, include: { media: true } } } }),
    db.category.findMany({ orderBy: { order: "asc" } }),
  ]);
  if (!p) notFound();

  let applications: string[] = [];
  try {
    applications = JSON.parse(p.applications);
  } catch {}
  const media = Object.fromEntries(
    [p.cover, ...p.images.map((i) => i.media)].filter(Boolean).map((m) => [m!.id, { id: m!.id, url: m!.url, alt: m!.alt }]),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/products" className="text-sm text-ink/70 hover:text-ink">
        ← All products
      </Link>
      <div className="mt-3 flex flex-wrap items-baseline gap-4">
        <h1 className="display text-5xl">{p.name}</h1>
        {!p.published && <span className="label bg-ink/10 px-2 py-1">Unpublished</span>}
        {p.published && (
          <Link href={`/products/${p.slug}`} target="_blank" className="text-sm text-accent-deep hover:underline">
            View live ↗
          </Link>
        )}
      </div>
      <div className="mt-6">
        <ProductForm
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          media={media}
          initial={{
            id: p.id,
            name: p.name,
            slug: p.slug,
            categoryId: p.categoryId,
            summary: p.summary,
            description: p.description,
            applications,
            quoteNote: p.quoteNote,
            featured: p.featured,
            published: p.published,
            coverId: p.coverId,
            galleryIds: p.images.map((i) => i.mediaId).filter((mid) => mid !== p.coverId),
            focalX: p.focalX,
            focalY: p.focalY,
          }}
        />
      </div>
    </div>
  );
}
