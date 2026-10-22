import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BackToCatalogue } from "./BackToCatalogue";
import type { ProductView } from "@/lib/content";
import type { Settings } from "@/lib/settings-schema";
import { whatsappHref, whatsappMessage } from "@/lib/contact";
import { ProductGallery } from "./ProductGallery";
import { QuoteLink } from "./QuoteLink";
import { QuoteSection } from "./QuoteSection";
import { ArrowRight, WhatsAppIcon } from "./icons";

type Props = {
  product: ProductView;
  index: number;
  related: ProductView[];
  settings: Settings;
  materials: { slug: string; name: string; category: string }[];
  preview?: boolean;
};

export function ProductDetail({ product, index, related, settings, materials, preview }: Props) {
  const gallery = product.gallery.length ? product.gallery : product.cover ? [product.cover] : [];
  return (
    <div data-wa-product={product.name}>
      {preview && (
        <div className="fixed inset-x-0 bottom-0 z-[60] bg-accent px-4 py-2 text-center text-sm font-medium text-ink">
          Preview{product.published ? "" : " — this product is unpublished and hidden from the public site"}.
        </div>
      )}
      <section className="relative bg-ink pb-20 pt-[calc(var(--header-h)+1.5rem)] text-paper md:pb-28">
        <div className="tech-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="gutter relative">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center justify-between gap-4 border-b border-paper/12 pb-4">
            <Suspense fallback={<span className="label text-paper/70">Back to catalogue</span>}>
              <BackToCatalogue />
            </Suspense>
            <ol className="label flex gap-2 text-paper/60">
              <li>
                <Link href="/products" className="hover:text-paper">
                  Materials
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/products?cat=${product.category.slug}`} className="hover:text-paper">
                  {product.category.name}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-paper/80">
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7" data-reveal="mask">
              <ProductGallery images={gallery} name={product.name} focal={{ x: product.focalX, y: product.focalY }} />
            </div>

            <div className="flex flex-col lg:col-span-5">
              <p className="label flex items-center gap-3 text-paper/60">
                <span className="text-accent">M—{String(index).padStart(2, "0")}</span>
                <span className="h-px w-8 bg-paper/30" />
                {product.category.name}
              </p>
              <h1 className="display mt-4 text-[clamp(3.6rem,8vw,8rem)]">{product.name}</h1>
              <p className="mt-6 text-xl leading-relaxed text-paper/85">{product.summary}</p>
              {product.description !== product.summary && <p className="mt-4 leading-relaxed text-paper/65">{product.description}</p>}

              {product.applications.length > 0 && (
                <div className="mt-10">
                  <h2 className="label text-paper/50">Intended applications</h2>
                  <ul className="mt-3 border-t border-paper/12">
                    {product.applications.map((a, i) => (
                      <li key={a} className="flex items-baseline gap-4 border-b border-paper/12 py-3">
                        <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-lg">{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-10 border-l-2 border-accent pl-5">
                <h2 className="label text-paper/50">Pricing</h2>
                <p className="mt-2 text-paper/80">{product.quoteNote}</p>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                <QuoteLink material={product.slug} source="product-detail" className="btn btn-primary min-h-14 sm:col-span-2">
                  Request a Quote for This Material <ArrowRight />
                </QuoteLink>
                <a
                  href={whatsappHref(settings.contact.whatsapp, whatsappMessage(product.name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost-dark min-h-12 sm:col-span-2"
                >
                  <span className="inline-flex items-center gap-2">
                    <WhatsAppIcon size={16} /> Enquire on WhatsApp
                  </span>
                  <ArrowRight />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="bg-paper py-20 md:py-28">
          <div className="gutter">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="related-heading" className="display text-5xl md:text-7xl">
                More {product.category.name.toLowerCase()}
              </h2>
              <Link href={`/products?cat=${product.category.slug}`} className="label inline-flex min-h-11 items-center gap-2 text-accent-deep hover:text-ink">
                All {product.category.name} <ArrowRight size={12} />
              </Link>
            </div>
            <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <li key={r.id} className="group">
                  <Link href={`/products/${r.slug}`} className="block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-paper-3">
                      {r.cover && (
                        <Image
                          src={r.cover.url}
                          alt={r.cover.alt}
                          fill
                          sizes="(min-width:1024px) 25vw, 50vw"
                          className="object-cover transition-transform duration-1000 group-hover:scale-105"
                          style={{ objectPosition: `${r.focalX}% ${r.focalY}%` }}
                        />
                      )}
                    </div>
                    <h3 className="display mt-4 text-4xl transition-colors group-hover:text-accent-deep">{r.name}</h3>
                    <p className="mt-1 text-sm text-ink/65">{r.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <QuoteSection sections={settings.sections} contact={settings.contact} materials={materials} defaultMaterial={product.slug} />
    </div>
  );
}
