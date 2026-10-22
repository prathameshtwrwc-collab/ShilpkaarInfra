"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { deleteProduct, reorder, setProductFlag } from "@/app/admin/actions/catalogue";
import { Toggle, useActionToast } from "./ui";

type Row = { id: string; name: string; slug: string; category: string; cover: string | null; published: boolean; featured: boolean; enquiries: number };

export function ProductList({ products }: { products: Row[] }) {
  const [rows, setRows] = useState(products);
  useEffect(() => setRows(products), [products]);
  const [pending, start] = useTransition();
  const done = useActionToast();
  const router = useRouter();

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    start(async () => void done(await reorder("product", next.map((r) => r.id)), "Order saved."));
  };

  const flag = (id: string, f: "published" | "featured", v: boolean) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [f]: v } : r)));
    start(async () => {
      if (!done(await setProductFlag(id, f, v), "Saved.")) router.refresh();
    });
  };

  const remove = (r: Row) => {
    const msg = `Delete “${r.name}”? This cannot be undone.${r.enquiries ? `\n\n${r.enquiries} enquir${r.enquiries === 1 ? "y keeps" : "ies keep"} the material name.` : ""}\n\nTip: unpublish instead to hide it temporarily.`;
    if (!confirm(msg)) return;
    start(async () => {
      if (done(await deleteProduct(r.id))) router.refresh();
    });
  };

  return (
    <ol className="divide-y divide-ink/10 border border-ink/10 bg-white" aria-busy={pending}>
      {rows.map((r, i) => (
        <li key={r.id} className="grid grid-cols-[auto_4rem_1fr] items-center gap-4 px-4 py-3 md:grid-cols-[auto_4rem_1fr_auto_auto]">
          <div className="flex flex-col">
            <button type="button" aria-label={`Move ${r.name} up`} disabled={i === 0 || pending} onClick={() => move(i, -1)} className="h-6 w-8 text-ink/65 hover:text-ink disabled:opacity-20">
              ▲
            </button>
            <button type="button" aria-label={`Move ${r.name} down`} disabled={i === rows.length - 1 || pending} onClick={() => move(i, 1)} className="h-6 w-8 text-ink/65 hover:text-ink disabled:opacity-20">
              ▼
            </button>
          </div>
          <div className="relative h-14 w-16 overflow-hidden bg-paper-2">
            {r.cover ? <Image src={r.cover} alt="" fill sizes="64px" className="object-cover" /> : <span className="label absolute inset-0 grid place-items-center text-[0.5rem] text-danger">No photo</span>}
          </div>
          <div className="min-w-0">
            <Link href={`/admin/products/${r.id}`} className="font-semibold hover:underline">
              {r.name}
            </Link>
            <p className="truncate text-xs text-ink/65">
              {r.category} · /products/{r.slug}
              {r.enquiries ? ` · ${r.enquiries} enquiries` : ""}
            </p>
          </div>
          <div className="col-span-3 flex flex-wrap gap-x-5 md:col-span-1">
            <Toggle checked={r.published} onChange={(v) => flag(r.id, "published", v)} label="Published" />
            <Toggle checked={r.featured} onChange={(v) => flag(r.id, "featured", v)} label="Featured" />
          </div>
          <div className="col-span-3 flex gap-3 text-sm md:col-span-1">
            <Link href={`/admin/products/${r.id}`} className="font-medium text-accent-deep hover:underline">
              Edit
            </Link>
            <button type="button" onClick={() => remove(r)} className="text-danger hover:underline">
              Delete
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
