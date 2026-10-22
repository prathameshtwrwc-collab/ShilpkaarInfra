import { RiseHeading } from "./SectionHead";

/** Dark opening band for inner pages — keeps the header language consistent. */
export function PageIntro({ index, label, title, children }: { index: string; label: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-ink pb-16 pt-[calc(var(--header-h)+4rem)] text-paper md:pb-24 md:pt-[calc(var(--header-h)+6rem)]">
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="gutter relative">
        <p className="label flex items-center gap-3 text-paper/60">
          <span className="text-accent">{index}</span>
          <span className="h-px w-10 bg-paper/30" />
          {label}
        </p>
        <RiseHeading as="h1" text={title} className="mt-8 max-w-[16ch] text-[clamp(3.2rem,9vw,9rem)]" />
        {children && <div className="mt-8 max-w-xl text-lg leading-relaxed text-paper/75">{children}</div>}
      </div>
    </section>
  );
}
