import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMaterialOptions, getProductBySlug, getProducts, getSettings } from "@/lib/content";
import { ProductDetail } from "@/components/site/ProductDetail";
import { Header } from "@/components/site/Header";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

/** Admin-only preview: renders the public product page, including unpublished products. */
export default async function PreviewProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const row = await db.product.findUnique({ where: { id }, select: { slug: true } });
  if (!row) notFound();
  const [product, all, settings, materials] = await Promise.all([getProductBySlug(row.slug, true), getProducts(), getSettings(), getMaterialOptions()]);
  if (!product) notFound();
  const index = Math.max(1, all.findIndex((p) => p.id === product.id) + 1);
  const related = all.filter((p) => p.category.slug === product.category.slug && p.id !== product.id).slice(0, 4);
  return (
    <>
      <Header contact={settings.contact} />
      <main>
        <ProductDetail product={product} index={index} related={related} settings={settings} materials={materials} preview />
      </main>
    </>
  );
}
