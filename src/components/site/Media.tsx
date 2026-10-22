import Image from "next/image";
import clsx from "clsx";
import type { MediaView } from "@/lib/content";

type Props = {
  media: Pick<MediaView, "url" | "alt" | "credit" | "license" | "representative"> | null | undefined;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  focal?: { x: number; y: number };
  /** Shows a discreet "Representative image" + credit tag. */
  tag?: "vehicle" | "image" | false;
  tagClassName?: string;
  fallbackLabel?: string;
};

/** Fill-mode image with focal point, credit tag and an honest placeholder. */
export function Media({ media, sizes, className, imgClassName, priority, focal, tag = "image", tagClassName, fallbackLabel }: Props) {
  if (!media) {
    return (
      <div className={clsx(!className?.includes("absolute") && "relative", "overflow-hidden bg-ink-3 text-paper/60", className)}>
        <div className="absolute inset-0 tech-grid opacity-60" />
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <span className="label">{fallbackLabel ?? "Photograph to be supplied"}</span>
        </div>
      </div>
    );
  }
  return (
    <div className={clsx(!className?.includes("absolute") && "relative", "overflow-hidden", className)}>
      <Image
        src={media.url}
        alt={media.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={clsx("object-cover", imgClassName)}
        style={focal ? { objectPosition: `${focal.x}% ${focal.y}%` } : undefined}
      />
      {tag && media.representative && (
        <span
          className={clsx(
            "label pointer-events-none absolute bottom-2 left-2 z-[2] max-w-[85%] truncate bg-ink/55 px-1.5 py-1 text-[0.5625rem] text-paper/80 backdrop-blur-sm",
            tagClassName,
          )}
          title={media.credit ? `Photo: ${media.credit} · ${media.license ?? ""}` : undefined}
        >
          {tag === "vehicle" ? "Representative vehicle image" : "Representative image"}
          {media.credit ? ` · ${media.credit}` : ""}
          {media.license ? ` · ${media.license}` : ""}
        </span>
      )}
    </div>
  );
}
