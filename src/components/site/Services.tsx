"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { ServiceView } from "@/lib/content";
import { Media } from "./Media";
import { QuoteLink } from "./QuoteLink";
import { RiseHeading, SectionLabel } from "./SectionHead";
import { ArrowRight } from "./icons";
import { pad } from "./catalogue-types";

export function Services({ services, heading, headingAs = "h2" }: { services: ServiceView[]; heading: string; headingAs?: "h1" | "h2" }) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.idx));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [services.length]);

  return (
    <section id="services" aria-labelledby="services-heading" className="relative bg-paper-3 py-24 text-ink md:py-36">
      <div className="gutter">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <SectionLabel index="03" tone="light" className="text-ink/70">
              Services
            </SectionLabel>
          </div>
          <div id="services-heading" className="md:col-span-9">
            <RiseHeading as={headingAs} text={heading} className="text-[clamp(3rem,8.4vw,9rem)]" />
          </div>
        </div>

        <div className="mt-16 grid gap-10 md:mt-24 lg:grid-cols-12 lg:gap-12">
          <ol className="lg:col-span-6">
            {services.map((s, i) => (
              <li
                key={s.id}
                id={s.slug}
                ref={(el) => void (items.current[i] = el)}
                data-idx={i}
                className="scroll-mt-28 border-t border-ink/15 py-10 lg:flex lg:min-h-[62vh] lg:flex-col lg:justify-center lg:py-16"
              >
                {/* Mobile/tablet image */}
                <div className="mb-6 lg:hidden" data-reveal="mask">
                  <Media media={s.image} sizes="100vw" className="aspect-[16/10]" />
                </div>
                <div className="flex items-start gap-5 md:gap-8">
                  <span
                    className={clsx(
                      "display shrink-0 text-6xl leading-none transition-colors duration-500 md:text-8xl",
                      i === active ? "text-accent-deep" : "text-transparent [-webkit-text-stroke:1px_rgb(15_15_14/0.35)]",
                    )}
                    aria-hidden="true"
                  >
                    {pad(i + 1)}
                  </span>
                  <div>
                    <h3 className="display text-[2.6rem] md:text-6xl">{s.title}</h3>
                    <p className="mt-4 max-w-md text-lg leading-relaxed text-ink/80">{s.summary}</p>
                    {s.detail && <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink/70">{s.detail}</p>}
                    <QuoteLink
                      note={`Service enquiry: ${s.title}`}
                      source={`service-${s.slug}`}
                      className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:text-accent-deep"
                    >
                      <span className="link-draw">Enquire about {s.title.toLowerCase()}</span> <ArrowRight size={14} />
                    </QuoteLink>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Desktop sticky stage */}
          <div className="hidden lg:col-span-6 lg:block">
            <div className="sticky top-[calc(var(--header-h)+2rem)] h-[calc(100vh-var(--header-h)-4rem)]">
              <div className="relative h-full overflow-hidden bg-ink">
                {services.map((s, i) => (
                  <div
                    key={s.id}
                    className="absolute inset-0 transition-[clip-path] duration-[1.1s] ease-[var(--ease-in-out-quart)]"
                    style={{ clipPath: i <= active ? "inset(0 0 0 0)" : "inset(100% 0 0 0)", zIndex: i }}
                    aria-hidden={i !== active}
                  >
                    <Media
                      media={s.image}
                      sizes="50vw"
                      className="h-full w-full"
                      imgClassName={clsx("transition-transform duration-[1.6s] ease-[var(--ease-out-expo)]", i === active ? "scale-100" : "scale-110")}
                    />
                  </div>
                ))}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-ink/70 to-transparent p-5 text-paper">
                  <span className="label">Fig. 04 — {services[active]?.title}</span>
                  <span className="label">
                    {pad(active + 1)} / {pad(services.length)}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 z-20 h-1 bg-accent transition-[width] duration-700" style={{ width: `${((active + 1) / services.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
