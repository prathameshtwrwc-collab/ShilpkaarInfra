"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "./icons";

/** Returns to the catalogue with the visitor's filters, search and view intact. */
export function BackToCatalogue() {
  const router = useRouter();
  const from = useSearchParams().get("from");
  let qs = "";
  if (from) {
    // Only carry known catalogue keys back.
    const src = new URLSearchParams(from);
    const safe = new URLSearchParams();
    for (const k of ["cat", "q", "sort", "view"]) {
      const v = src.get(k);
      if (v) safe.set(k, v.slice(0, 80));
    }
    qs = safe.toString();
  }
  return (
    <Link
      href={`/products${qs ? `?${qs}` : ""}#products`}
      onClick={(e) => {
        // Arrived from a catalogue page in this tab: go back so scroll and state return exactly.
        if (from || !document.referrer) return;
        try {
          const ref = new URL(document.referrer);
          if (ref.origin === location.origin && (ref.pathname === "/products" || ref.pathname === "/") && history.length > 1) {
            e.preventDefault();
            router.back();
          }
        } catch {}
      }}
      className="label inline-flex min-h-11 items-center gap-3 text-paper/70 hover:text-paper"
    >
      <ArrowLeft size={14} /> Back to catalogue
    </Link>
  );
}
