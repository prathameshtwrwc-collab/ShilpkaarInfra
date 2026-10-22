import { RiseHeading, SectionLabel } from "./SectionHead";
import { QuoteLink } from "./QuoteLink";
import { ArrowRight } from "./icons";
import { pad } from "./catalogue-types";

type Item = { id: string; title: string; body: string };

/** Differentiators drawn as stations on a single transit line. */
export function Why({ items, heading }: { items: Item[]; heading: string }) {
  return (
    <section id="why" aria-labelledby="why-heading" className="relative overflow-hidden bg-accent py-24 text-ink md:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(-45deg,#0f0f0e_0_2px,transparent_2px_22px)]" />
      <div className="gutter relative">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <SectionLabel index="06" className="text-ink/70 [&_span:first-child]:text-ink">
              Why Shilpkar
            </SectionLabel>
            <div id="why-heading" className="mt-8">
              <RiseHeading text={heading} className="text-[clamp(3rem,9vw,9.5rem)]" />
            </div>
          </div>
          <QuoteLink source="why" className="btn btn-ink">
            Start a quote <ArrowRight />
          </QuoteLink>
        </div>

        {/* Desktop: horizontal line, stations alternate above / below */}
        <div className="relative mt-24 hidden lg:block">
          <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 bg-ink" data-reveal="wipe" />
          <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
            {items.map((it, i) => {
              const up = i % 2 === 0;
              return (
                <li key={it.id} className="relative flex h-[26rem] flex-col items-start" data-reveal style={{ ["--d" as string]: `${300 + i * 110}ms` }}>
                  <div className={up ? "mt-0 pr-6" : "mt-auto pr-6"}>
                    <p className="label text-ink/70">Stop {pad(i + 1)}</p>
                    <h3 className="display mt-2 text-[2rem] leading-[0.92] xl:text-[2.4rem]">{it.title}</h3>
                    <p className="mt-2 max-w-[16rem] text-sm leading-snug text-ink/80">{it.body}</p>
                  </div>
                  <span className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 border-[3px] border-ink bg-accent" />
                  <span className={`absolute left-[7px] w-px bg-ink/60 ${up ? "bottom-1/2 top-[9.5rem]" : "top-1/2 bottom-[9.5rem]"}`} />
                </li>
              );
            })}
          </ol>
        </div>

        {/* Mobile: vertical line */}
        <ol className="relative mt-16 space-y-10 border-l-[3px] border-ink pl-8 lg:hidden">
          {items.map((it, i) => (
            <li key={it.id} className="relative" data-reveal>
              <span className="absolute -left-[2.6rem] top-1 h-4 w-4 border-[3px] border-ink bg-accent" />
              <p className="label text-ink/70">Stop {pad(i + 1)}</p>
              <h3 className="display mt-1 text-4xl">{it.title}</h3>
              <p className="mt-1 text-[0.9375rem] text-ink/80">{it.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
