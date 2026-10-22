"use client";

import Link from "next/link";
import clsx from "clsx";

export const QUOTE_EVENT = "shilpkar:quote";
export type QuoteEventDetail = { material?: string; note?: string; source?: string };

/**
 * Opens the quote form with the material (or service note) preselected.
 * If a quote form is on the current page it scrolls there in place;
 * otherwise it navigates to /contact with the selection in the URL.
 */
export function QuoteLink({
  material,
  note,
  source,
  className,
  children,
  "aria-label": ariaLabel,
}: QuoteEventDetail & { className?: string; children: React.ReactNode; "aria-label"?: string }) {
  const params = new URLSearchParams();
  if (material) params.set("material", material);
  if (note) params.set("note", note);
  if (source) params.set("source", source);
  const href = `/contact${params.size ? `?${params}` : ""}#quote`;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={clsx(className)}
      onClick={(e) => {
        const form = document.getElementById("quote");
        if (!form || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent<QuoteEventDetail>(QUOTE_EVENT, { detail: { material, note, source } }));
        form.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }}
    >
      {children}
    </Link>
  );
}
