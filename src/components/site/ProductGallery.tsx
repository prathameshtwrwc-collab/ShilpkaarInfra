"use client";

import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";
import type { MediaView } from "@/lib/content";

export function ProductGallery({ images, name, focal }: { images: MediaView[]; name: string; focal: { x: number; y: number } }) {
  const [i, setI] = useState(0);
  const current = images[i];

  if (!current) {
    return (
      <div className="tech-grid relative grid aspect-[4/3] place-items-center bg-ink-2">
        <span className="label text-paper/60">Photograph to be supplied</span>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-2 md:aspect-[16/12]">
        {images.map((img, idx) => (
          <Image
            key={img.id}
            src={img.url}
            alt={img.alt || name}
            fill
            priority={idx === 0}
            sizes="(min-width:1024px) 60vw, 100vw"
            className={clsx("object-cover transition-opacity duration-700", idx === i ? "opacity-100" : "opacity-0")}
            style={idx === 0 ? { objectPosition: `${focal.x}% ${focal.y}%` } : undefined}
          />
        ))}
        {current.representative && (
          <p className="label absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/80 to-transparent px-3 pb-2.5 pt-8 text-[0.5625rem] text-paper/80">
            Representative image{current.credit ? ` · Photo: ${current.credit}` : ""}
            {current.license ? ` · ${current.license}` : ""}
          </p>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3" role="group" aria-label="Product photographs">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setI(idx)}
              aria-pressed={idx === i}
              aria-label={`Show photograph ${idx + 1} of ${images.length}`}
              className={clsx("relative h-20 w-28 overflow-hidden ring-offset-2 ring-offset-ink transition", idx === i ? "ring-2 ring-accent" : "opacity-60 hover:opacity-100")}
            >
              <Image src={img.url} alt="" fill sizes="112px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
