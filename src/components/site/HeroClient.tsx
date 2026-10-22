"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Scroll-linked depth: the plate sinks slower than the page; copy lifts away. */
export function HeroDepth({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const section = ref.current?.closest("section");
        if (!section) return;
        gsap.to(ref.current, {
          yPercent: 14,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
        });
        const copy = section.querySelector("[data-hero-copy]");
        if (copy)
          gsap.to(copy, {
            yPercent: -18,
            opacity: 0.25,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
          });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className="absolute inset-0 -top-[4%] h-[108%] will-change-transform">
      {children}
    </div>
  );
}

/** Background video only for capable desktop clients; poster image otherwise. */
export function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const ok =
      window.matchMedia("(min-width: 768px)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !conn?.saveData &&
      !/(^|-)2g$/.test(conn?.effectiveType ?? "");
    setEnabled(ok);
  }, []);
  if (!enabled) return null;
  return (
    <video
      className="absolute inset-0 h-full w-full object-cover"
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  );
}
