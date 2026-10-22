import clsx from "clsx";

/** Split a heading into rising lines at sentence/clause breaks. */
export function splitHeading(text: string) {
  const parts = text.split(/(?<=[.:])\s+/).filter(Boolean);
  if (parts.length > 1) return parts;
  const words = text.split(" ");
  if (words.length <= 3) return [text];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

export function RiseHeading({
  text,
  as: Tag = "h2",
  className,
  accentLast = false,
}: {
  text: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  accentLast?: boolean;
}) {
  const lines = splitHeading(text);
  return (
    <Tag className={clsx("display rise", className)}>
      {lines.map((l, i) => (
        <span key={i}>
          <span style={{ ["--i" as string]: i }} className={accentLast && i === lines.length - 1 ? "text-accent" : undefined}>
            {l}
          </span>{" "}
        </span>
      ))}
    </Tag>
  );
}

export function SectionLabel({ index, children, className, tone = "dark" }: { index: string; children: React.ReactNode; className?: string; tone?: "dark" | "light" }) {
  return (
    <p className={clsx("label flex items-center gap-3", className)} data-reveal>
      <span className={tone === "light" ? "text-accent-deep" : "text-accent"}>{index}</span>
      <span className="h-px w-10 bg-current opacity-30" />
      <span>{children}</span>
    </p>
  );
}
