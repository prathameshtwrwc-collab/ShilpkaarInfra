"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import clsx from "clsx";
import { ArrowRight, ArrowUpRight, CloseIcon, SearchIcon } from "./icons";
import { QuoteLink } from "./QuoteLink";
import { pad, type CatalogueItem } from "./catalogue-types";

type Category = { name: string; slug: string; count: number };
type Sort = "featured" | "az" | "za";
type View = "editorial" | "index";

const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Featured first" },
  { value: "az", label: "Name A–Z" },
  { value: "za", label: "Name Z–A" },
];

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const squash = (s: string) => norm(s).replace(/[\s\-]/g, "");

function matches(item: CatalogueItem, q: string) {
  if (!q) return true;
  const hay = [item.name, item.summary, item.description, item.category.name, ...item.applications].join(" ");
  const terms = norm(q).split(" ").filter(Boolean);
  const h = norm(hay);
  const hs = squash(hay);
  return terms.every((t) => h.includes(t) || hs.includes(squash(t)));
}

/* Editorial grid rhythm: rows of differing proportions, adapted to however
   many items remain after filtering so no row is left with dead space. */
type Cell = { span: string; aspect: string; sizes: string; offset: string };
const C = {
  7: { span: "md:col-span-7", aspect: "aspect-[4/3] md:aspect-[16/11]", sizes: "(min-width:768px) 58vw, 100vw" },
  5: { span: "md:col-span-5", aspect: "aspect-[4/3] md:aspect-[4/5]", sizes: "(min-width:768px) 42vw, 100vw" },
  4: { span: "md:col-span-4", aspect: "aspect-[4/3] md:aspect-[3/4]", sizes: "(min-width:768px) 33vw, 100vw" },
  6: { span: "md:col-span-6", aspect: "aspect-[4/3] md:aspect-[5/4]", sizes: "(min-width:768px) 50vw, 100vw" },
  12: { span: "md:col-span-12", aspect: "aspect-[4/3] md:aspect-[21/8]", sizes: "100vw" },
} as const;
const ROWS: { cols: (keyof typeof C)[]; offsets: string[] }[] = [
  { cols: [7, 5], offsets: ["", "md:mt-24"] },
  { cols: [4, 4, 4], offsets: ["", "md:mt-16", "md:mt-32"] },
  { cols: [5, 7], offsets: ["md:mt-10", ""] },
  { cols: [6, 6], offsets: ["md:mt-20", ""] },
];
function layout(count: number): Cell[] {
  const out: Cell[] = [];
  let r = 0;
  while (out.length < count) {
    const left = count - out.length;
    let row = ROWS[r % ROWS.length];
    if (row.cols.length > left) row = left === 1 ? { cols: [12], offsets: [""] } : left === 2 ? ROWS[0] : ROWS[1];
    row.cols.forEach((c, i) => out.push({ ...C[c], offset: row.offsets[i] }));
    r++;
  }
  return out;
}

export function Catalogue({ items, categories }: { items: CatalogueItem[]; categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const reduce = useReducedMotion();

  const validCats = useMemo(() => new Set(categories.map((c) => c.slug)), [categories]);
  const cat = validCats.has(params.get("cat") ?? "") ? params.get("cat")! : "all";
  const sort = (SORTS.some((s) => s.value === params.get("sort")) ? params.get("sort") : "featured") as Sort;
  const view = (params.get("view") === "index" ? "index" : "editorial") as View;
  const [query, setQuery] = useState(params.get("q") ?? "");
  const deferredQuery = useDeferredValue(query);

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "" || (k === "cat" && v === "all") || (k === "sort" && v === "featured") || (k === "view" && v === "editorial"))
          next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [params, pathname, router],
  );

  // Debounce search into the URL so the state survives back-navigation.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== query.trim()) update({ q: query.trim() || null });
    }, 300);
    return () => clearTimeout(t);
  }, [query, params, update]);

  const results = useMemo(() => {
    const list = items.filter((i) => (cat === "all" || i.category.slug === cat) && matches(i, deferredQuery));
    if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
    else if (sort === "za") list.sort((a, b) => b.name.localeCompare(a.name, "en", { numeric: true }));
    else list.sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order);
    return list;
  }, [items, cat, sort, deferredQuery]);

  const fromQs = params.toString();
  const detailHref = (slug: string) => `/products/${slug}${fromQs ? `?from=${encodeURIComponent(fromQs)}` : ""}`;
  const hasFilters = cat !== "all" || deferredQuery.trim() !== "" || sort !== "featured";
  const catName = categories.find((c) => c.slug === cat)?.name;

  const resetAll = () => {
    setQuery("");
    update({ cat: null, q: null, sort: null });
  };

  const [feature, ...rest] = results;
  const showFeature = view === "editorial" && feature && (sort === "featured" ? feature.featured : true);
  const gridItems = showFeature ? rest : results;
  const cells = layout(gridItems.length);

  return (
    <div>
      {/* ── Controls ── */}
      <div className="sticky top-[var(--header-h)] z-20 -mx-[var(--gutter)] border-y border-ink/10 bg-paper/95 px-[var(--gutter)] backdrop-blur-md">
        <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div role="group" aria-label="Filter by category" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
            {[{ name: "All Materials", slug: "all", count: items.length }, ...categories].map((c) => {
              const on = cat === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ cat: c.slug })}
                  className={clsx(
                    "relative flex min-h-11 shrink-0 items-baseline gap-2 px-3.5 text-sm font-medium transition-colors",
                    on ? "text-paper" : "text-ink/70 hover:text-ink",
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="cat-pill"
                      className="absolute inset-0 bg-ink"
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span className="relative">{c.name}</span>
                  <span className={clsx("relative font-mono text-[0.625rem]", on ? "text-accent" : "text-ink/65")}>{pad(c.count)}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <label className="relative flex min-h-11 flex-1 items-center lg:w-72 lg:flex-none">
              <span className="sr-only">Search materials</span>
              <SearchIcon className="pointer-events-none absolute left-0 text-ink/65" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search — e.g. plaster, 20 mm, RCC"
                className="h-11 w-full border-b border-ink/25 bg-transparent pl-6 pr-2 text-sm placeholder:text-ink/65 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Sort materials</span>
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="field h-11 w-auto cursor-pointer py-0 text-sm"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <div role="group" aria-label="Layout" className="hidden border border-ink/15 sm:flex">
              {(["editorial", "index"] as View[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => update({ view: v })}
                  className={clsx("label h-11 px-3 transition-colors", view === v ? "bg-ink text-paper" : "text-ink/70 hover:text-ink")}
                >
                  {v === "editorial" ? "Gallery" : "Index"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Status line ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-6" aria-live="polite">
        <p className="label text-ink/70">
          <span className="text-ink">{pad(results.length)}</span> of {pad(items.length)} materials
          {catName ? ` · ${catName}` : ""}
          {deferredQuery.trim() ? ` · “${deferredQuery.trim()}”` : ""}
        </p>
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {catName && <Chip onRemove={() => update({ cat: null })}>{catName}</Chip>}
            {deferredQuery.trim() && <Chip onRemove={() => setQuery("")}>“{deferredQuery.trim()}”</Chip>}
            {sort !== "featured" && <Chip onRemove={() => update({ sort: null })}>{SORTS.find((s) => s.value === sort)?.label}</Chip>}
            <button type="button" onClick={resetAll} className="label min-h-9 px-2 text-accent-deep underline-offset-4 hover:underline">
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {results.length === 0 ? (
        <div className="grid place-items-start gap-5 border-t border-ink/10 py-20">
          <p className="display text-5xl md:text-7xl">No match.</p>
          <p className="max-w-md text-ink/70">
            Nothing in the catalogue matches {deferredQuery.trim() ? `“${deferredQuery.trim()}”` : "these filters"}
            {catName ? ` in ${catName}` : ""}. We also source project-specific materials on request.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={resetAll} className="btn btn-ink">
              Show all materials <ArrowRight />
            </button>
            <QuoteLink note={deferredQuery.trim() ? `Looking for: ${deferredQuery.trim()}` : undefined} source="catalogue-empty" className="btn btn-ghost-light">
              Ask for a material <ArrowRight />
            </QuoteLink>
          </div>
        </div>
      ) : view === "index" ? (
        <IndexView items={results} detailHref={detailHref} />
      ) : (
        <div>
          {showFeature && <FeaturePanel item={feature} href={detailHref(feature.slug)} />}
          <motion.ul layout={!reduce} className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-12 md:gap-x-8 md:gap-y-20">
            <AnimatePresence mode="popLayout" initial={false}>
              {gridItems.map((item, i) => (
                <Tile key={item.slug} item={item} rhythm={cells[i]} href={detailHref(item.slug)} reduce={!!reduce} />
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>
      )}
    </div>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="group inline-flex min-h-9 items-center gap-2 border border-ink/20 px-2.5 text-xs font-medium hover:border-ink"
      aria-label={`Remove filter ${typeof children === "string" ? children : ""}`}
    >
      {children}
      <CloseIcon size={10} className="opacity-50 group-hover:opacity-100" />
    </button>
  );
}

function CatTag({ item, className }: { item: CatalogueItem; className?: string }) {
  return (
    <p className={clsx("label flex items-center gap-2", className)}>
      <span className="text-accent-deep">M—{pad(item.index)}</span>
      <span className="opacity-60">/ {item.category.name}</span>
    </p>
  );
}

/** Pointer-reactive crop: the image drifts slightly toward the cursor. */
function useCropShift() {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty("--sx", `${x * -14}px`);
    ref.current.style.setProperty("--sy", `${y * -14}px`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--sx", "0px");
    ref.current?.style.setProperty("--sy", "0px");
  };
  return { ref, onMove, onLeave };
}

function FeaturePanel({ item, href }: { item: CatalogueItem; href: string }) {
  const crop = useCropShift();
  return (
    <article className="mb-20 grid gap-6 border-b border-ink/10 pb-20 md:grid-cols-12 md:gap-8" aria-labelledby={`f-${item.slug}`}>
      <Link
        href={href}
        className="group relative block overflow-hidden md:col-span-8"
        onPointerMove={crop.onMove}
        onPointerLeave={crop.onLeave}
        aria-label={`View ${item.name}`}
      >
        <div ref={crop.ref} className="relative aspect-[4/3] overflow-hidden bg-paper-3 md:aspect-[16/10]" data-reveal="mask">
          {item.cover && (
            <Image
              src={item.cover.url}
              alt={item.cover.alt}
              fill
              sizes="(min-width:768px) 66vw, 100vw"
              className="scale-[1.08] object-cover transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] [transform:translate3d(var(--sx,0),var(--sy,0),0)_scale(1.08)] group-hover:[transform:translate3d(var(--sx,0),var(--sy,0),0)_scale(1.13)]"
              style={{ objectPosition: `${item.focalX}% ${item.focalY}%` }}
            />
          )}
          <span className="label absolute left-3 top-3 bg-accent px-2 py-1 text-ink">Featured material</span>
          {item.cover?.representative && (
            <span className="label absolute bottom-2 left-2 bg-ink/55 px-1.5 py-1 text-[0.5625rem] text-paper/80 backdrop-blur-sm">
              Representative image{item.cover.credit ? ` · ${item.cover.credit}` : ""}
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-col md:col-span-4">
        <p className="display text-[7rem] leading-none text-ink/[0.07] md:text-[10rem]" aria-hidden="true">
          {pad(item.index)}
        </p>
        <CatTag item={item} className="-mt-4 text-ink" />
        <h3 id={`f-${item.slug}`} className="display mt-3 text-[clamp(3rem,6vw,5.5rem)]">
          <Link href={href} className="hover:text-accent-deep">
            {item.name}
          </Link>
        </h3>
        <p className="mt-4 max-w-sm text-[1.0625rem] leading-relaxed text-ink/75">{item.summary}</p>
        {item.applications.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-1">
            {item.applications.map((a) => (
              <li key={a} className="label text-ink/70">
                [ {a} ]
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap gap-3 pt-8">
          <QuoteLink material={item.slug} source="catalogue-feature" className="btn btn-primary">
            Request a quote <ArrowRight />
          </QuoteLink>
          <Link href={href} className="btn btn-ghost-light">
            Details <ArrowUpRight />
          </Link>
        </div>
      </div>
    </article>
  );
}

function Tile({ item, rhythm, href, reduce }: { item: CatalogueItem; rhythm: Cell; href: string; reduce: boolean }) {
  const crop = useCropShift();
  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={clsx("group", rhythm.span, rhythm.offset)}
    >
      <article aria-labelledby={`t-${item.slug}`}>
        <Link href={href} className="block" onPointerMove={crop.onMove} onPointerLeave={crop.onLeave} tabIndex={-1} aria-hidden="true">
          <div ref={crop.ref} className={clsx("relative overflow-hidden bg-paper-3", rhythm.aspect)}>
            {item.cover ? (
              <Image
                src={item.cover.url}
                alt=""
                fill
                sizes={rhythm.sizes}
                className="object-cover transition-[transform,filter] duration-[1.2s] ease-[var(--ease-out-expo)] [transform:translate3d(var(--sx,0),var(--sy,0),0)_scale(1.06)] group-hover:[transform:translate3d(var(--sx,0),var(--sy,0),0)_scale(1.12)] md:saturate-[0.85] md:group-hover:saturate-100"
                style={{ objectPosition: `${item.focalX}% ${item.focalY}%` }}
              />
            ) : (
              <div className="tech-grid-light absolute inset-0 grid place-items-center">
                <span className="label text-ink/65">Photograph to be supplied</span>
              </div>
            )}
            {/* Index plate that wipes in on hover */}
            <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-end justify-between bg-ink/85 p-4 text-paper backdrop-blur-sm transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-y-0 max-md:hidden">
              <span className="label">{item.applications.join(" · ")}</span>
              <ArrowUpRight />
            </div>
            {item.cover?.representative && (
              <span className="label absolute right-2 top-2 bg-ink/50 px-1.5 py-0.5 text-[0.5rem] text-paper/75 backdrop-blur-sm">Representative image</span>
            )}
          </div>
        </Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CatTag item={item} className="text-ink" />
            <h3 id={`t-${item.slug}`} className="display mt-2 text-[2.5rem] md:text-5xl">
              <Link href={href} className="transition-colors hover:text-accent-deep">
                {item.name}
              </Link>
            </h3>
            <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-ink/70">{item.summary}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-5 text-sm font-medium">
          <QuoteLink material={item.slug} source="catalogue" className="inline-flex min-h-11 items-center gap-2 text-ink hover:text-accent-deep" aria-label={`Request a quote for ${item.name}`}>
            <span className="link-draw">Request quote</span> <ArrowRight size={13} />
          </QuoteLink>
          <Link href={href} className="inline-flex min-h-11 items-center gap-2 text-ink/70 hover:text-ink" aria-label={`View details for ${item.name}`}>
            <span className="link-draw">Details</span>
          </Link>
        </div>
      </article>
    </motion.li>
  );
}

function IndexView({ items, detailHref }: { items: CatalogueItem[]; detailHref: (slug: string) => string }) {
  const [hover, setHover] = useState<CatalogueItem | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !preview.current) return;
    preview.current.style.transform = `translate3d(${e.clientX + 24}px, ${e.clientY - 120}px, 0)`;
  };

  return (
    <div onPointerMove={onMove} onPointerLeave={() => setHover(null)} className="relative">
      <div className="label hidden grid-cols-12 gap-6 border-b border-ink/15 pb-3 text-ink/65 md:grid">
        <span className="col-span-1">No.</span>
        <span className="col-span-4">Material</span>
        <span className="col-span-2">Category</span>
        <span className="col-span-3">Applications</span>
        <span className="col-span-2 text-right">Action</span>
      </div>
      <ul>
        {items.map((item) => (
          <li
            key={item.slug}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHover(item)}
            className="group grid grid-cols-[4.5rem_1fr] items-center gap-x-4 gap-y-2 border-b border-ink/10 py-4 transition-colors hover:bg-paper-2 md:grid-cols-12 md:gap-6 md:py-5"
          >
            <div className="relative row-span-2 aspect-square overflow-hidden bg-paper-3 md:hidden">
              {item.cover && <Image src={item.cover.url} alt="" fill sizes="72px" className="object-cover" />}
            </div>
            <span className="label hidden text-accent-deep md:col-span-1 md:block">M—{pad(item.index)}</span>
            <h3 className="md:col-span-4">
              <Link href={detailHref(item.slug)} className="display text-3xl transition-colors group-hover:text-accent-deep md:text-4xl">
                {item.name}
              </Link>
            </h3>
            <span className="label text-ink/70 md:col-span-2">{item.category.name}</span>
            <span className="hidden text-sm text-ink/70 md:col-span-3 md:block">{item.applications.join(", ")}</span>
            <div className="col-span-2 flex gap-4 md:col-span-2 md:justify-end">
              <QuoteLink material={item.slug} source="catalogue-index" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium hover:text-accent-deep" aria-label={`Request a quote for ${item.name}`}>
                Quote <ArrowRight size={13} />
              </QuoteLink>
            </div>
          </li>
        ))}
      </ul>
      {/* Cursor-following preview (desktop, mouse only) */}
      <div
        ref={preview}
        aria-hidden="true"
        className={clsx(
          "pointer-events-none fixed left-0 top-0 z-30 hidden h-60 w-48 overflow-hidden transition-opacity duration-300 md:block",
          hover ? "opacity-100" : "opacity-0",
        )}
      >
        {hover?.cover && <Image src={hover.cover.url} alt="" fill sizes="192px" className="object-cover" />}
      </div>
    </div>
  );
}
