"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveProduct, type ProductInput } from "@/app/admin/actions/catalogue";
import type { MediaItem } from "@/app/admin/actions/media";
import { MediaPicker } from "./MediaPicker";
import { Button, Card, Field, Toggle, inputCls, useActionToast } from "./ui";

type Thumb = { id: string; url: string; alt: string };

type Props = {
  initial: ProductInput & { id?: string };
  categories: { id: string; name: string }[];
  media: Record<string, Thumb>;
};

export function ProductForm({ initial, categories, media }: Props) {
  const [v, setV] = useState<ProductInput>(initial);
  const [thumbs, setThumbs] = useState<Record<string, Thumb>>(media);
  const [picker, setPicker] = useState<null | "cover" | "gallery">(null);
  const [appText, setAppText] = useState(initial.applications.join("\n"));
  const [useNewCat, setUseNewCat] = useState(false);
  const [aspect, setAspect] = useState(4 / 3);
  const [pending, start] = useTransition();
  const done = useActionToast();
  const router = useRouter();

  const set = <K extends keyof ProductInput>(k: K, val: ProductInput[K]) => setV((p) => ({ ...p, [k]: val }));
  const remember = (m: MediaItem) => setThumbs((t) => ({ ...t, [m.id]: { id: m.id, url: m.url, alt: m.alt } }));
  const cover = v.coverId ? thumbs[v.coverId] : null;

  const submit = () =>
    start(async () => {
      const payload: ProductInput = {
        ...v,
        applications: appText.split("\n").map((s) => s.trim()).filter(Boolean),
        newCategory: useNewCat ? v.newCategory : undefined,
        categoryId: useNewCat ? undefined : v.categoryId,
      };
      const res = await saveProduct(payload);
      if (done(res) && res.ok && res.data) {
        if (!v.id) router.replace(`/admin/products/${res.data.id}`);
        else router.refresh();
        setV((p) => ({ ...p, id: res.data!.id, slug: res.data!.slug }));
        setUseNewCat(false);
      }
    });

  const moveGallery = (i: number, dir: -1 | 1) => {
    const g = [...v.galleryIds];
    const j = i + dir;
    if (j < 0 || j >= g.length) return;
    [g[i], g[j]] = [g[j], g[i]];
    set("galleryIds", g);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid gap-6 xl:grid-cols-[1fr_22rem]"
    >
      <div className="grid content-start gap-6">
        <Card title="Details">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name">
              <input className={inputCls} value={v.name} onChange={(e) => set("name", e.target.value)} required maxLength={80} />
            </Field>
            <Field label="URL slug" hint={`/products/${v.slug || "(from name)"}`}>
              <input className={inputCls} value={v.slug ?? ""} onChange={(e) => set("slug", e.target.value)} placeholder="auto from name" maxLength={80} />
            </Field>
            <Field label="Category">
              {useNewCat ? (
                <input className={inputCls} placeholder="New category name" value={v.newCategory ?? ""} onChange={(e) => set("newCategory", e.target.value)} />
              ) : (
                <select className={inputCls} value={v.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value)}>
                  <option value="" disabled>
                    Choose…
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              <button type="button" className="mt-1 text-xs text-accent-deep underline" onClick={() => setUseNewCat((x) => !x)}>
                {useNewCat ? "Choose existing category" : "+ Create a new category"}
              </button>
            </Field>
            <div className="flex flex-wrap items-end gap-6">
              <Toggle checked={v.published} onChange={(x) => set("published", x)} label="Published" />
              <Toggle checked={v.featured} onChange={(x) => set("featured", x)} label="Featured" />
            </div>
            <Field label="Short summary" hint="Shown on catalogue cards (max 240 characters)." className="md:col-span-2">
              <textarea className={inputCls} rows={2} maxLength={240} value={v.summary} onChange={(e) => set("summary", e.target.value)} />
            </Field>
            <Field label="Description" hint="Shown on the product page. Only include verified information." className="md:col-span-2">
              <textarea className={inputCls} rows={4} maxLength={2000} value={v.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="Applications" hint="One per line, e.g. RCC work" className="md:col-span-1">
              <textarea className={inputCls} rows={4} value={appText} onChange={(e) => setAppText(e.target.value)} />
            </Field>
            <Field label="Pricing / quote note" hint="Shown under “Pricing” on the product page.">
              <textarea className={inputCls} rows={4} maxLength={300} value={v.quoteNote} onChange={(e) => set("quoteNote", e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card
          title="Gallery"
          actions={
            <Button variant="ghost" onClick={() => setPicker("gallery")}>
              + Add photographs
            </Button>
          }
        >
          {v.galleryIds.length === 0 ? (
            <p className="text-sm text-ink/65">Additional photographs appear as thumbnails on the product page. The cover image is always shown first.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {v.galleryIds.map((id, i) => (
                <li key={id} className="border border-ink/10">
                  <div className="relative aspect-square bg-paper-2">{thumbs[id] && <Image src={thumbs[id].url} alt="" fill sizes="160px" className="object-cover" />}</div>
                  <div className="flex justify-between p-1 text-xs">
                    <span className="flex">
                      <button type="button" className="px-1.5 py-1 disabled:opacity-30" disabled={i === 0} onClick={() => moveGallery(i, -1)} aria-label="Move left">
                        ◀
                      </button>
                      <button type="button" className="px-1.5 py-1 disabled:opacity-30" disabled={i === v.galleryIds.length - 1} onClick={() => moveGallery(i, 1)} aria-label="Move right">
                        ▶
                      </button>
                    </span>
                    <button type="button" className="px-1.5 py-1 text-danger" onClick={() => set("galleryIds", v.galleryIds.filter((g) => g !== id))}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid content-start gap-6">
        <Card title="Cover image & focal point">
          <div
            className="relative mx-auto max-h-80 max-w-full cursor-crosshair overflow-hidden bg-paper-2"
            style={{ aspectRatio: aspect, width: aspect < 1 ? `${aspect * 20}rem` : "100%" }}
            onClick={(e) => {
              if (!cover) return;
              const r = e.currentTarget.getBoundingClientRect();
              set("focalX", Math.round(((e.clientX - r.left) / r.width) * 100));
              set("focalY", Math.round(((e.clientY - r.top) / r.height) * 100));
            }}
            title={cover ? "Click to set the focal point" : undefined}
          >
            {cover ? (
              <>
                <Image
                  src={cover.url}
                  alt=""
                  fill
                  sizes="352px"
                  className="object-cover"
                  onLoad={(e) => setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight || 4 / 3)}
                />
                <span
                  className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_#f06a1f]"
                  style={{ left: `${v.focalX}%`, top: `${v.focalY}%` }}
                />
              </>
            ) : (
              <span className="label absolute inset-0 grid place-items-center text-danger">No cover image</span>
            )}
          </div>
          {cover && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["aspect-square", "aspect-[3/4]", "aspect-[21/9]"].map((a) => (
                <div key={a} className={`relative ${a} overflow-hidden bg-paper-2`}>
                  <Image src={cover.url} alt="" fill sizes="110px" className="object-cover" style={{ objectPosition: `${v.focalX}% ${v.focalY}%` }} />
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-ink/65">Click the image to choose what stays in frame when it is cropped. Previews show common crops.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setPicker("cover")}>
              {cover ? "Replace cover" : "Choose cover"}
            </Button>
            {cover && (
              <Button variant="ghost" onClick={() => set("coverId", null)}>
                Remove
              </Button>
            )}
          </div>
        </Card>

        <div className="sticky bottom-4 grid gap-2 border border-ink/10 bg-white p-4 shadow-lg">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : v.id ? "Save changes" : "Create product"}
          </Button>
          {v.id && (
            <Link href={`/admin/preview/products/${v.id}`} target="_blank" className="inline-flex min-h-10 items-center justify-center border border-ink/20 text-sm font-semibold hover:border-ink">
              Preview product page ↗
            </Link>
          )}
          <p className="text-center text-xs text-ink/65">Preview shows the last saved version, published or not.</p>
        </div>
      </div>

      {picker && (
        <MediaPicker
          kind="IMAGE"
          multiple={picker === "gallery"}
          onClose={() => setPicker(null)}
          onPick={(m) => {
            remember(m);
            set("coverId", m.id);
            setV((p) => ({ ...p, focalX: 50, focalY: 50 }));
            setPicker(null);
          }}
          onPickMany={(list) => {
            list.forEach(remember);
            set("galleryIds", [...new Set([...v.galleryIds, ...list.map((m) => m.id)])].filter((id) => id !== v.coverId));
            setPicker(null);
          }}
        />
      )}
    </form>
  );
}
