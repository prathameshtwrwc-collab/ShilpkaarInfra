import type { MediaView } from "@/lib/content";
import { Media } from "./Media";
import { RiseHeading, SectionLabel } from "./SectionHead";
import { pad } from "./catalogue-types";

type Industry = { id: string; name: string; note: string };

export function Industries({ industries, heading, image }: { industries: Industry[]; heading: string; image: MediaView | null }) {
  return (
    <section id="industries" aria-labelledby="industries-heading" className="relative bg-paper py-24 text-ink md:py-36">
      <div className="gutter grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2.5rem)]">
            <SectionLabel index="05" tone="light" className="text-ink/70">
              Industries we serve
            </SectionLabel>
            <div id="industries-heading" className="mt-8">
              <RiseHeading text={heading} className="text-[clamp(2.6rem,4.3vw,4.6rem)]" />
            </div>
            <div className="mt-10 hidden lg:block" data-reveal="mask">
              <Media media={image} sizes="30vw" className="aspect-[4/5]" />
            </div>
            <p className="label mt-3 hidden text-ink/65 lg:block">Fig. 05 — Redevelopment, Mumbai</p>
          </div>
        </div>

        <ol className="lg:col-span-8">
          {industries.map((ind, i) => (
            <li key={ind.id} data-reveal style={{ ["--d" as string]: `${(i % 4) * 60}ms` }} className="group relative border-t border-ink/15 last:border-b">
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 bg-ink transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-x-100"
              />
              <div className="relative grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 py-5 transition-colors duration-500 group-hover:text-paper md:grid-cols-[4rem_1fr_minmax(0,16rem)] md:py-6">
                <span className="label text-accent-deep transition-colors group-hover:text-accent">{pad(i + 1)}</span>
                <h3 className="display text-[2rem] leading-[0.95] sm:text-5xl xl:text-6xl">{ind.name}</h3>
                {ind.note && (
                  <p className="col-start-2 mt-2 text-sm leading-relaxed text-ink/70 transition-colors group-hover:text-paper/70 md:col-start-3 md:mt-0">
                    {ind.note}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
