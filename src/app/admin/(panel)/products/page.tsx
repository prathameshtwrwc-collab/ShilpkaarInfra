import Link from "next/link";
import { db } from "@/lib/db";
import { ProductList } from "@/components/admin/ProductList";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function AdminProducts() {
  const [products, categories] = await Promise.all([
    db.product.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], include: { category: true, cover: { select: { url: true } }, _count: { select: { enquiries: true } } } }),
    db.category.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { products: true } } } }),
  ]);
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-5xl md:text-6xl">Products</h1>
          <p className="mt-2 text-sm text-ink/70">Order here is the order on the public catalogue. Category filters update automatically.</p>
        </div>
        <Link href="/admin/products/new" className="inline-flex min-h-10 items-center bg-accent px-4 text-sm font-semibold hover:bg-[#ff7d36]">
          + New product
        </Link>
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <ProductList
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            category: p.category.name,
            cover: p.cover?.url ?? null,
            published: p.published,
            featured: p.featured,
            enquiries: p._count.enquiries,
          }))}
        />
        <CategoryManager categories={categories.map((c) => ({ id: c.id, name: c.name, count: c._count.products }))} />
      </div>
    </div>
  );
}
