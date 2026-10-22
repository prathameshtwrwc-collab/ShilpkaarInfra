import type { MediaView } from "@/lib/content";
import type { Settings } from "@/lib/settings-schema";
import { Media } from "./Media";
import { RiseHeading, SectionLabel } from "./SectionHead";
import { WorkingModel } from "./WorkingModel";

type Props = {
  about: Settings["about"];
  stats: Settings["stats"];
  image: MediaView | null;
  secondary: MediaView | null;
  headingAs?: "h1" | "h2";
};

export function About({ about, stats, image, secondary, headingAs = "h2" }: Props) {
  return (
    <section id="about" aria-labelledby="about-heading" className="relative overflow-clip bg-ink pb-24 pt-24 text-paper md:pb-36 md:pt-36">
      <div className="gutter">
        <SectionLabel index="01" className="text-paper/60">
          About Shilpkar
        </SectionLabel>

        <div id="about-heading" className="mt-8">
          <RiseHeading as={headingAs} text={about.heading} className="max-w-[14ch] text-[clamp(3rem,9vw,9.5rem)]" accentLast />
        </div>

        <div className="mt-16 grid gap-10 md:mt-24 lg:grid-cols-12 lg:gap-8">
          {/* Large plate with a smaller inset — city + infrastructure */}
          <figure className="relative lg:col-span-7">
            <div data-reveal="mask">
              <Media media={image} sizes="(min-width:1024px) 58vw, 100vw" className="aspect-[4/3] md:aspect-[16/11]" />
            </div>
            {secondary && (
              <div
                data-reveal="mask"
                style={{ ["--d" as string]: "250ms" }}
                className="absolute -bottom-10 right-4 hidden w-[38%] border-[6px] border-ink md:block lg:-right-10"
              >
                <Media media={secondary} sizes="22vw" className="aspect-[4/5]" tag={false} />
              </div>
            )}
            <figcaption className="label mt-4 text-paper/60">Fig. 02 — The city, rising. Material moves before anything stands.</figcaption>
          </figure>

          <div className="lg:col-span-4 lg:col-start-9 lg:pt-6">
            <p data-reveal className="text-xl leading-[1.45] text-paper/85 md:text-[1.4rem]">
              {about.intro}
            </p>
            {about.statements.length > 0 && (
              <ul className="mt-10 space-y-0">
                {about.statements.map((s, i) => (
                  <li key={i} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }} className="flex gap-4 border-t border-paper/12 py-4">
                    <span className="label pt-1 text-accent">—</span>
                    <span className="serif-accent text-2xl leading-tight text-paper/90">{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Indicators — editable figures, not performance claims */}
        {stats.length > 0 && (
          <dl className="mt-24 grid grid-cols-2 border-t border-paper/12 md:mt-32 md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={i}
                data-reveal
                style={{ ["--d" as string]: `${i * 80}ms` }}
                className="flex flex-col-reverse border-b border-paper/12 py-6 pr-4 md:border-b-0 md:border-r md:py-8 md:pl-6 md:first:pl-0 md:last:border-r-0"
              >
                <dt className="label mt-3 text-paper/55">{s.label}</dt>
                <dd className="display text-[clamp(3rem,7vw,6.5rem)] text-paper">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-28 md:mt-40">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <h3 className="display-wide text-sm text-paper/60">How a load reaches your site</h3>
            <p className="serif-accent max-w-md text-2xl text-paper/80">Four stages, one coordinated line.</p>
          </div>
          <WorkingModel steps={about.steps} />
        </div>
      </div>
    </section>
  );
}
