import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/site/ProductDetail";
import { getMaterialOptions, getProductBySlug, getProducts, getSettings } from "@/lib/content";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Material not found" };
  return {
    title: `${p.name} — ${p.category.name} supply, Mumbai`,
    description: p.summary,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      title: `${p.name} — SHILPKAR TRANSIT INFRA`,
      description: p.summary,
      images: p.cover ? [{ url: p.cover.url, alt: p.cover.alt }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, all, settings, materials] = await Promise.all([getProductBySlug(slug), getProducts(), getSettings(), getMaterialOptions()]);
  if (!product) notFound();
  const index = all.findIndex((p) => p.id === product.id) + 1;
  const related = all.filter((p) => p.category.slug === product.category.slug && p.id !== product.id).slice(0, 4);
  return <ProductDetail product={product} index={index} related={related} settings={settings} materials={materials} />;
}
