"use client";

import { useId, useState } from "react";
import clsx from "clsx";
import type { FleetView } from "@/lib/content";
import { Media } from "./Media";
import { QuoteLink } from "./QuoteLink";
import { RiseHeading, SectionLabel } from "./SectionHead";
import { ArrowRight } from "./icons";
import { pad } from "./catalogue-types";

/** Line drawing used only when no authentic photograph has been uploaded. */
function VehicleDrawing({ axles = 4 }: { axles?: number }) {
  const wheels = Array.from({ length: axles }, (_, i) => (i === 0 ? 90 : 250 + i * 70));
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink-2">
      <div className="tech-grid absolute inset-0 opacity-60" />
      <svg viewBox="0 0 600 260" className="relative w-[78%] text-paper/55" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M40 180V95l22-40h68v125" />
        <path d="M70 62h48v40H58z" strokeOpacity="0.6" />
        <path d="M130 180h440" />
        <path d="M150 170V80h410l-20 90" />
        <path d="M150 80l30-22h360l20 22" strokeOpacity="0.5" />
        {wheels.map((x) => (
          <g key={x}>
            <circle cx={x} cy="196" r="24" />
            <circle cx={x} cy="196" r="9" strokeOpacity="0.5" />
          </g>
        ))}
        <path d="M20 222h560" strokeDasharray="3 6" strokeOpacity="0.5" />
      </svg>
      <p className="label absolute bottom-5 left-5 right-5 text-center text-paper/55">Line drawing · photograph to be supplied</p>
    </div>
  );
}

function VehicleVisual({ v, sizes, priority }: { v: FleetView; sizes: string; priority?: boolean }) {
  if (!v.image) return <VehicleDrawing axles={/multi/i.test(v.vehicleClass) ? 5 : 3} />;
  return <Media media={v.image} sizes={sizes} priority={priority} tag="vehicle" className="absolute inset-0" />;
}

export function Fleet({ fleet, heading, intro, headingAs = "h2" }: { fleet: FleetView[]; heading: string; intro: string; headingAs?: "h1" | "h2" }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const v = fleet[active];

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = fleet.length;
    let next = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % n;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + n) % n;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = n - 1;
    if (next > -1) {
      e.preventDefault();
      setActive(next);
      document.getElementById(`${id}-tab-${next}`)?.focus();
    }
  };

  return (
    <section id="fleet" aria-labelledby="fleet-heading" className="relative overflow-hidden bg-ink py-24 text-paper md:py-36">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="gutter relative">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <SectionLabel index="04" className="text-paper/60">
              Fleet
            </SectionLabel>
            <div id="fleet-heading" className="mt-8">
              <RiseHeading as={headingAs} text={heading} className="text-[clamp(3rem,8.4vw,9rem)]" accentLast />
            </div>
          </div>
          <p data-reveal className="max-w-sm text-lg leading-relaxed text-paper/70 md:col-span-4 md:justify-self-end">
            {intro}
          </p>
        </div>

        {/* Desktop: stage + tab index */}
        <div className="mt-20 hidden gap-8 lg:grid lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div
              role="tabpanel"
              id={`${id}-panel`}
              aria-labelledby={`${id}-tab-${active}`}
              className="relative aspect-[16/10] overflow-hidden bg-ink-2"
              data-reveal="wipe"
            >
              {fleet.map((f, i) => (
                <div
                  key={f.id}
                  className={clsx(
                    "absolute inset-0 transition-[opacity,transform] duration-[900ms] ease-[var(--ease-out-expo)]",
                    i === active ? "scale-100 opacity-100" : "pointer-events-none scale-[1.04] opacity-0",
                  )}
                  aria-hidden={i !== active}
                >
                  <VehicleVisual v={f} sizes="66vw" />
                </div>
              ))}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-ink/70 to-transparent" />
              <div className="pointer-events-none absolute left-6 top-5 right-6 flex justify-between">
                <span className="label text-paper/70">Class — {v.vehicleClass}</span>
                <span className="label text-paper/70">
                  {pad(active + 1)} / {pad(fleet.length)}
                </span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-12 gap-6">
              <p className="display col-span-5 text-6xl xl:text-7xl">{v.name}</p>
              <div className="col-span-7">
                <p className="serif-accent text-2xl text-paper/90">{v.role}</p>
                {v.description && <p className="mt-2 text-[0.9375rem] leading-relaxed text-paper/60">{v.description}</p>}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div role="tablist" aria-label="Vehicle classes" aria-orientation="vertical" className="border-t border-paper/15">
              {fleet.map((f, i) => (
                <button
                  key={f.id}
                  id={`${id}-tab-${i}`}
                  role="tab"
                  type="button"
                  aria-selected={i === active}
                  aria-controls={`${id}-panel`}
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  onKeyDown={(e) => onKey(e, i)}
                  className="group relative block w-full border-b border-paper/15 py-6 text-left"
                >
                  <span
                    className={clsx(
                      "absolute left-0 top-0 h-full w-0.5 origin-top bg-accent transition-transform duration-500",
                      i === active ? "scale-y-100" : "scale-y-0",
                    )}
                  />
                  <span className="flex items-baseline justify-between gap-4 pl-5">
                    <span className={clsx("display text-4xl transition-colors", i === active ? "text-paper" : "text-paper/60 group-hover:text-paper/70")}>
                      {f.name}
                    </span>
                    <span className={clsx("label", i === active ? "text-accent" : "text-paper/60")}>{pad(i + 1)}</span>
                  </span>
                  <span className="label mt-2 block pl-5 text-paper/50">{f.vehicleClass}</span>
                </button>
              ))}
            </div>
            <QuoteLink note="Transport enquiry" source="fleet" className="btn btn-primary mt-8 w-full">
              Plan transport for my site <ArrowRight />
            </QuoteLink>
            <p className="mt-4 text-xs leading-relaxed text-paper/60">
              Photographs show representative vehicles of each class and are credited to their photographers.
            </p>
          </div>
        </div>

        {/* Mobile/tablet: stacked features, no horizontal traps */}
        <ul className="mt-14 space-y-14 lg:hidden">
          {fleet.map((f, i) => (
            <li key={f.id}>
              <div className="relative aspect-[4/3] overflow-hidden bg-ink-2" data-reveal="mask">
                <VehicleVisual v={f} sizes="100vw" />
              </div>
              <div className="mt-5 flex items-baseline justify-between gap-4">
                <h3 className="display text-5xl">{f.name}</h3>
                <span className="label text-accent">{pad(i + 1)}</span>
              </div>
              <p className="label mt-2 text-paper/55">{f.vehicleClass}</p>
              <p className="serif-accent mt-3 text-2xl text-paper/90">{f.role}</p>
              {f.description && <p className="mt-2 text-[0.9375rem] text-paper/60">{f.description}</p>}
            </li>
          ))}
          <li>
            <QuoteLink note="Transport enquiry" source="fleet" className="btn btn-primary min-h-14 w-full">
              Plan transport for my site <ArrowRight />
            </QuoteLink>
          </li>
        </ul>
      </div>
    </section>
  );
}
