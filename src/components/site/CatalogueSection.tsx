import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { Settings } from "@/lib/settings-schema";
import { Catalogue } from "./Catalogue";
import { pad, type CatalogueItem } from "./catalogue-types";
import { RiseHeading, SectionLabel } from "./SectionHead";
import { QuoteLink } from "./QuoteLink";
import { ArrowRight } from "./icons";

type Props = {
  copy: Settings["catalogue"];
  items: CatalogueItem[];
  categories: { name: string; slug: string; count: number }[];
  headingAs?: "h1" | "h2";
};

export function CatalogueSection({ copy, items, categories, headingAs = "h2" }: Props) {
  return (
    <section id="products" aria-labelledby="catalogue-heading" className="relative bg-paper pb-28 text-ink md:pb-40">
      {/* Transition from graphite: a stepped ground line */}
      <div aria-hidden="true" className="h-16 bg-ink [clip-path:polygon(0_0,100%_0,100%_35%,62%_35%,62%_100%,0_100%)] md:h-24" />

      <div className="gutter relative pt-14 md:pt-20">
        <div className="tech-grid-light pointer-events-none absolute inset-0 -z-0" />
        <div className="relative grid gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionLabel index="02" tone="light" className="text-ink/70">
              Material library
            </SectionLabel>
            <p
              aria-hidden="true"
              className="display mt-6 select-none text-[11rem] leading-[0.75] text-transparent [-webkit-text-stroke:1.5px_var(--color-concrete)] md:text-[16rem]"
            >
              {pad(items.length)}
            </p>
            <p className="label mt-2 text-ink/65">Listed grades · {categories.length} families</p>
          </div>
          <div className="md:col-span-8 md:pt-10">
            <div id="catalogue-heading">
              <RiseHeading as={headingAs} text={copy.heading} className="text-[clamp(3.4rem,10vw,10.5rem)]" />
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2 md:items-end">
              <p data-reveal className="max-w-md text-lg leading-relaxed text-ink/75 md:text-xl">
                {copy.subcopy}
              </p>
              <p data-reveal style={{ ["--d" as string]: "120ms" }} className="serif-accent max-w-sm text-xl text-ink/70 md:justify-self-end md:text-right">
                {copy.note}
              </p>
            </div>
          </div>
        </div>

        {/* Expanding texture strip — each slice is a real material photograph */}
        <ul className="no-scrollbar relative mt-16 flex h-[46vw] max-h-[30rem] min-h-[15rem] gap-1 overflow-x-auto md:mt-24 md:overflow-visible" aria-label="Materials at a glance">
          {items.map((item, i) => (
            <li
              key={item.slug}
              data-reveal="mask"
              style={{ ["--d" as string]: `${i * 45}ms` }}
              className="group relative min-w-[30vw] flex-1 overflow-hidden transition-[flex-grow] duration-700 ease-[var(--ease-out-expo)] hover:grow-[5] focus-within:grow-[5] md:min-w-0"
            >
              <Link href={`/products/${item.slug}`} className="absolute inset-0 block" aria-label={`${item.name} — ${item.category.name}`}>
                {item.cover && (
                  <Image
                    src={item.cover.url}
                    alt=""
                    fill
                    sizes="(min-width:768px) 30vw, 40vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    style={{ objectPosition: `${item.focalX}% ${item.focalY}%` }}
                  />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                <span className="label absolute left-2 top-2 text-paper/80">{pad(i + 1)}</span>
                <span className="absolute inset-x-2 bottom-2 text-paper">
                  <span className="display block text-base leading-[0.95] md:whitespace-nowrap md:text-lg md:origin-bottom-left md:-rotate-90 md:translate-x-[0.9em] md:group-hover:rotate-0 md:group-hover:translate-x-0 md:group-hover:text-3xl md:transition-all md:duration-500">
                    {item.name}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between">
          <p className="label text-ink/65">Hover or tap a slice to open a material</p>
          <QuoteLink source="catalogue-strip" className="label inline-flex min-h-11 items-center gap-2 text-accent-deep hover:text-ink">
            Need something else? Ask us <ArrowRight size={12} />
          </QuoteLink>
        </div>

        <div className="mt-20 md:mt-28">
          <Suspense fallback={<div className="h-40" />}>
            <Catalogue items={items} categories={categories} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
