"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { listMedia, type MediaItem } from "@/app/admin/actions/media";
import { Button, useToast } from "./ui";
import { ACCEPT, precheck, uploadFile } from "./upload";

/** Thumbnail + "Choose / Upload / Remove" control backed by the media library. */
export function MediaField({
  value,
  onChange,
  kind = "IMAGE",
  label,
  preview,
}: {
  value: string | null;
  onChange: (id: string | null, item?: MediaItem) => void;
  kind?: "IMAGE" | "VIDEO";
  label: string;
  preview?: { url: string; kind: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(preview ?? null);
  useEffect(() => setCurrent(preview ?? null), [preview]);

  return (
    <div>
      <span className="label mb-1.5 block text-ink/65">{label}</span>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden border border-ink/15 bg-paper-2">
          {value && current ? (
            current.kind === "VIDEO" ? (
              <video src={current.url} className="h-full w-full object-cover" muted />
            ) : (
              <Image src={current.url} alt="" fill sizes="112px" className="object-cover" />
            )
          ) : (
            <span className="label absolute inset-0 grid place-items-center text-[0.5rem] text-ink/65">None</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setOpen(true)}>
            {value ? "Change" : "Choose"}
          </Button>
          {value && (
            <Button variant="ghost" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      {open && (
        <MediaPicker
          kind={kind}
          onClose={() => setOpen(false)}
          onPick={(m) => {
            setCurrent({ url: m.url, kind: m.kind });
            onChange(m.id, m);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

export function MediaPicker({
  kind,
  onPick,
  onClose,
  multiple,
  onPickMany,
}: {
  kind?: "IMAGE" | "VIDEO";
  onPick?: (m: MediaItem) => void;
  onClose: () => void;
  multiple?: boolean;
  onPickMany?: (m: MediaItem[]) => void;
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [selected, setSelected] = useState<MediaItem[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const toast = useToast();
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listMedia(kind).then((r) => (r.ok ? setItems(r.data ?? []) : toast("error", r.error)));
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kind, onClose, toast]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const err = precheck(file);
    if (err) return toast("error", err);
    setProgress(0);
    try {
      const m = await uploadFile(file, { onProgress: setProgress });
      setItems((list) => [m, ...(list ?? [])]);
      toast("ok", "Uploaded. Add alt text and credits in the Media library.");
      if (!multiple) onPick?.(m);
      else setSelected((s) => [...s, m]);
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Media library" className="flex max-h-[88vh] w-full max-w-5xl flex-col bg-paper outline-none">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
          <h2 className="display-wide text-sm">Media library</h2>
          <div className="flex items-center gap-2">
            <label className="inline-flex min-h-10 cursor-pointer items-center bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink-3">
              {progress !== null ? `Uploading ${progress}%` : "Upload new"}
              <input type="file" accept={kind === "VIDEO" ? "video/mp4,video/webm" : kind === "IMAGE" ? "image/*" : ACCEPT} className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} disabled={progress !== null} />
            </label>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </header>
        {progress !== null && (
          <div className="h-1 bg-ink/10">
            <div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        )}
        <div className="overflow-y-auto p-5">
          {!items ? (
            <p className="text-sm text-ink/70">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-ink/70">No files yet — upload one.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {items.map((m) => {
                const on = selected.some((s) => s.id === m.id);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => (multiple ? setSelected((s) => (on ? s.filter((x) => x.id !== m.id) : [...s, m])) : onPick?.(m))}
                      className={clsx("group block w-full text-left outline-none", on && "ring-4 ring-accent")}
                      aria-pressed={multiple ? on : undefined}
                    >
                      <div className="relative aspect-square overflow-hidden bg-paper-2">
                        {m.kind === "VIDEO" ? (
                          <video src={m.url} className="h-full w-full object-cover" muted />
                        ) : (
                          <Image src={m.url} alt="" fill sizes="180px" className="object-cover transition-transform group-hover:scale-105" />
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-ink/70">{m.alt || "No alt text"}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {multiple && (
          <footer className="flex items-center justify-between border-t border-ink/10 px-5 py-3">
            <span className="text-sm text-ink/70">{selected.length} selected</span>
            <Button onClick={() => onPickMany?.(selected)} disabled={!selected.length}>
              Add to gallery
            </Button>
          </footer>
        )}
      </div>
    </div>
  );
}
