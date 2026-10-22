"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import { deleteMedia, mediaUsage, updateMedia, type MediaItem } from "@/app/admin/actions/media";
import { Button, Field, Toggle, inputCls, useActionToast, useToast } from "./ui";
import { ACCEPT, MAX_IMAGE_MB, MAX_VIDEO_MB, precheck, uploadFile } from "./upload";

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const [list, setList] = useState(items);
  useEffect(() => setList(items), [items]);
  const [sel, setSel] = useState<MediaItem | null>(null);
  const [uploads, setUploads] = useState<{ name: string; pct: number }[]>([]);
  const [filter, setFilter] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");
  const [drag, setDrag] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const upload = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const err = precheck(file);
      if (err) {
        toast("error", `${file.name}: ${err}`);
        continue;
      }
      setUploads((u) => [...u, { name: file.name, pct: 0 }]);
      try {
        const m = await uploadFile(file, {
          alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
          onProgress: (pct) => setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, pct } : x))),
        });
        setList((l) => [m, ...l]);
        setSel(m);
        toast("ok", `${file.name} uploaded.`);
      } catch (e) {
        toast("error", `${file.name}: ${(e as Error).message}`);
      } finally {
        setUploads((u) => u.filter((x) => x.name !== file.name));
      }
    }
    router.refresh();
  };

  const shown = list.filter((m) => filter === "ALL" || m.kind === filter);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <div>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            upload(e.dataTransfer.files);
          }}
          className={clsx(
            "flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-10 text-center transition-colors",
            drag ? "border-accent bg-accent-soft/40" : "border-ink/20 bg-white hover:border-ink/40",
          )}
        >
          <span className="font-semibold">Drop files here or click to upload</span>
          <span className="text-xs text-ink/65">
            JPG, PNG, WebP or AVIF up to {MAX_IMAGE_MB} MB (converted to optimised WebP) · MP4 or WebM up to {MAX_VIDEO_MB} MB
          </span>
          <input type="file" multiple accept={ACCEPT} className="sr-only" onChange={(e) => e.target.files && upload(e.target.files)} />
        </label>
        {uploads.map((u) => (
          <div key={u.name} className="mt-2 bg-white p-3 text-sm">
            <div className="flex justify-between">
              <span className="truncate">{u.name}</span>
              <span className="font-mono">{u.pct}%</span>
            </div>
            <div className="mt-2 h-1 bg-ink/10">
              <div className="h-full bg-accent transition-[width]" style={{ width: `${u.pct}%` }} />
            </div>
          </div>
        ))}

        <div className="mt-6 flex gap-1" role="group" aria-label="Filter media">
          {(["ALL", "IMAGE", "VIDEO"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={clsx("label min-h-9 px-3", filter === f ? "bg-ink text-paper" : "bg-white")}>
              {f === "ALL" ? `All (${list.length})` : f === "IMAGE" ? "Images" : "Videos"}
            </button>
          ))}
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => setSel(m)} className={clsx("block w-full bg-white text-left", sel?.id === m.id && "ring-4 ring-accent")}>
                <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
                  {m.kind === "VIDEO" ? (
                    <video src={m.url} muted className="h-full w-full object-cover" />
                  ) : (
                    <Image src={m.url} alt="" fill sizes="220px" className="object-cover" />
                  )}
                  {m.kind === "VIDEO" && <span className="label absolute left-1 top-1 bg-ink px-1.5 py-0.5 text-paper">Video</span>}
                  {!m.alt && <span className="label absolute right-1 top-1 bg-danger px-1.5 py-0.5 text-white">No alt</span>}
                </div>
                <p className="truncate px-2 py-1.5 text-xs">{m.alt || "—"}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>{sel ? <MediaDetails key={sel.id} item={sel} onChange={(m) => { setList((l) => l.map((x) => (x.id === m.id ? m : x))); setSel(m); }} onDeleted={(id) => { setList((l) => l.filter((x) => x.id !== id)); setSel(null); }} /> : <p className="border border-ink/10 bg-white p-5 text-sm text-ink/70">Select a file to see its details.</p>}</div>
    </div>
  );
}

function MediaDetails({ item, onChange, onDeleted }: { item: MediaItem; onChange: (m: MediaItem) => void; onDeleted: (id: string) => void }) {
  const [v, setV] = useState({
    alt: item.alt,
    credit: item.credit ?? "",
    license: item.license ?? "",
    sourceUrl: item.sourceUrl ?? "",
    representative: item.representative,
  });
  const [used, setUsed] = useState<string[] | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const done = useActionToast();
  const toast = useToast();
  const router = useRouter();
  const replaceInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mediaUsage(item.id).then((r) => r.ok && setUsed([...new Set(r.data ?? [])]));
  }, [item.id]);

  const replace = async (file?: File) => {
    if (!file) return;
    const err = precheck(file);
    if (err) return toast("error", err);
    setPct(0);
    try {
      const m = await uploadFile(file, { replaceId: item.id, onProgress: setPct });
      onChange(m);
      toast("ok", "File replaced everywhere it is used. Update the credit details below.");
      router.refresh();
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setPct(null);
    }
  };

  return (
    <section className="sticky top-4 border border-ink/10 bg-white">
      <div className="relative aspect-[4/3] bg-paper-2">
        {item.kind === "VIDEO" ? <video src={item.url} controls muted className="h-full w-full object-contain" /> : <Image src={item.url} alt={item.alt} fill sizes="352px" className="object-contain" />}
      </div>
      <div className="grid gap-4 p-5">
        <dl className="grid grid-cols-2 gap-2 text-xs text-ink/70">
          <dt>Type</dt>
          <dd className="text-ink">{item.mime}</dd>
          <dt>Size</dt>
          <dd className="text-ink">{kb(item.size)}</dd>
          {item.width && (
            <>
              <dt>Dimensions</dt>
              <dd className="text-ink">
                {item.width} × {item.height}
              </dd>
            </>
          )}
          <dt>Used in</dt>
          <dd className="text-ink">{used === null ? "…" : used.length ? used.join(", ") : "Not used"}</dd>
        </dl>
        <Field label="Alt text" hint="Describe what the image shows, for screen readers and SEO.">
          <textarea className={inputCls} rows={2} value={v.alt} onChange={(e) => setV({ ...v, alt: e.target.value })} />
        </Field>
        <Field label="Credit / photographer">
          <input className={inputCls} value={v.credit} onChange={(e) => setV({ ...v, credit: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Licence">
            <input className={inputCls} value={v.license} placeholder="e.g. Own photo" onChange={(e) => setV({ ...v, license: e.target.value })} />
          </Field>
          <Field label="Source URL">
            <input className={inputCls} value={v.sourceUrl} onChange={(e) => setV({ ...v, sourceUrl: e.target.value })} />
          </Field>
        </div>
        <Toggle checked={v.representative} onChange={(x) => setV({ ...v, representative: x })} label="Representative (not company-owned) — shows a label" />
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} onClick={() => start(async () => void (done(await updateMedia(item.id, v)) && onChange({ ...item, ...v })))}>
            Save details
          </Button>
          <Button variant="ghost" disabled={pct !== null} onClick={() => replaceInput.current?.click()}>
            {pct !== null ? `Replacing ${pct}%` : "Replace file"}
          </Button>
          <input ref={replaceInput} type="file" accept={item.kind === "VIDEO" ? "video/mp4,video/webm" : "image/*"} className="sr-only" onChange={(e) => replace(e.target.files?.[0])} />
          <Button
            variant="danger"
            disabled={pending || (used?.length ?? 0) > 0}
            title={used?.length ? "Remove it from pages first" : undefined}
            onClick={() =>
              confirm("Delete this file permanently?") &&
              start(async () => {
                if (done(await deleteMedia(item.id))) onDeleted(item.id);
              })
            }
          >
            Delete
          </Button>
        </div>
      </div>
    </section>
  );
}
