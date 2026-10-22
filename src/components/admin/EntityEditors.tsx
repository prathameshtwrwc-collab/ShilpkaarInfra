"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { reorder } from "@/app/admin/actions/catalogue";
import { deleteService, deleteVehicle, saveService, saveVehicle } from "@/app/admin/actions/content";
import { MediaField } from "./MediaPicker";
import { Button, Field, Toggle, inputCls, useActionToast } from "./ui";

type Preview = { url: string; kind: string } | null;

export type ServiceRow = { id?: string; title: string; summary: string; detail: string; imageId: string | null; published: boolean; preview: Preview };
export type VehicleRow = {
  id?: string;
  name: string;
  vehicleClass: string;
  role: string;
  description: string;
  imageId: string | null;
  published: boolean;
  preview: Preview;
};

function useList<T extends { id?: string }>(initial: T[]) {
  const [rows, setRows] = useState(initial);
  useEffect(() => setRows(initial), [initial]);
  return [rows, setRows] as const;
}

function OrderButtons({ i, n, onMove, disabled }: { i: number; n: number; onMove: (d: -1 | 1) => void; disabled: boolean }) {
  return (
    <span className="flex gap-1">
      <Button variant="ghost" className="px-2" aria-label="Move up" disabled={disabled || i === 0} onClick={() => onMove(-1)}>
        ▲
      </Button>
      <Button variant="ghost" className="px-2" aria-label="Move down" disabled={disabled || i === n - 1} onClick={() => onMove(1)}>
        ▼
      </Button>
    </span>
  );
}

export function ServiceEditor({ services }: { services: ServiceRow[] }) {
  const [rows, setRows] = useList(services);
  const [pending, start] = useTransition();
  const done = useActionToast();
  const router = useRouter();
  const patch = (i: number, p: Partial<ServiceRow>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...p } : x)));

  const move = (i: number, d: -1 | 1) => {
    const next = [...rows];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setRows(next);
    const ids = next.map((r) => r.id).filter(Boolean) as string[];
    start(async () => void done(await reorder("service", ids), "Order saved."));
  };

  return (
    <div className="grid gap-5">
      {rows.map((s, i) => (
        <section key={s.id ?? `new-${i}`} className="border border-ink/10 bg-white">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
            <h2 className="display-wide text-xs">
              {String(i + 1).padStart(2, "0")} — {s.title || "New service"}
            </h2>
            {s.id && <OrderButtons i={i} n={rows.length} onMove={(d) => move(i, d)} disabled={pending} />}
          </header>
          <div className="grid gap-5 p-5 md:grid-cols-[1fr_16rem]">
            <div className="grid gap-4">
              <Field label="Title">
                <input className={inputCls} value={s.title} maxLength={60} onChange={(e) => patch(i, { title: e.target.value })} />
              </Field>
              <Field label="Summary">
                <textarea className={inputCls} rows={2} maxLength={240} value={s.summary} onChange={(e) => patch(i, { summary: e.target.value })} />
              </Field>
              <Field label="Detail" hint="Avoid promising approvals or capabilities not confirmed by the business.">
                <textarea className={inputCls} rows={3} maxLength={600} value={s.detail} onChange={(e) => patch(i, { detail: e.target.value })} />
              </Field>
            </div>
            <div className="grid content-start gap-4">
              <MediaField label="Image" value={s.imageId} preview={s.preview} onChange={(id, m) => patch(i, { imageId: id, preview: m ? { url: m.url, kind: m.kind } : null })} />
              <Toggle checked={s.published} onChange={(v) => patch(i, { published: v })} label="Published" />
              <div className="flex gap-2">
                <Button
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      if (done(await saveService({ id: s.id, title: s.title, summary: s.summary, detail: s.detail, imageId: s.imageId, published: s.published })))
                        router.refresh();
                    })
                  }
                >
                  Save
                </Button>
                {s.id ? (
                  <Button
                    variant="danger"
                    disabled={pending}
                    onClick={() =>
                      confirm(`Delete service “${s.title}”?`) &&
                      start(async () => {
                        if (done(await deleteService(s.id!), "Service deleted.")) router.refresh();
                      })
                    }
                  >
                    Delete
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}
      <Button variant="ink" className="justify-self-start" onClick={() => setRows((r) => [...r, { title: "", summary: "", detail: "", imageId: null, published: true, preview: null }])}>
        + Add service
      </Button>
    </div>
  );
}

export function FleetEditor({ vehicles }: { vehicles: VehicleRow[] }) {
  const [rows, setRows] = useList(vehicles);
  const [pending, start] = useTransition();
  const done = useActionToast();
  const router = useRouter();
  const patch = (i: number, p: Partial<VehicleRow>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...p } : x)));

  const move = (i: number, d: -1 | 1) => {
    const next = [...rows];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setRows(next);
    start(async () => void done(await reorder("fleet", next.map((r) => r.id).filter(Boolean) as string[]), "Order saved."));
  };

  return (
    <div className="grid gap-5">
      {rows.map((v, i) => (
        <section key={v.id ?? `new-${i}`} className="border border-ink/10 bg-white">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
            <h2 className="display-wide text-xs">{v.name || "New vehicle"}</h2>
            {v.id && <OrderButtons i={i} n={rows.length} onMove={(d) => move(i, d)} disabled={pending} />}
          </header>
          <div className="grid gap-5 p-5 md:grid-cols-[1fr_16rem]">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Vehicle / model">
                <input className={inputCls} value={v.name} maxLength={60} onChange={(e) => patch(i, { name: e.target.value })} />
              </Field>
              <Field label="Class">
                <input className={inputCls} value={v.vehicleClass} maxLength={60} onChange={(e) => patch(i, { vehicleClass: e.target.value })} />
              </Field>
              <Field label="Typical use" className="md:col-span-2">
                <input className={inputCls} value={v.role} maxLength={160} onChange={(e) => patch(i, { role: e.target.value })} />
              </Field>
              <Field label="Description" className="md:col-span-2">
                <textarea className={inputCls} rows={2} maxLength={400} value={v.description} onChange={(e) => patch(i, { description: e.target.value })} />
              </Field>
            </div>
            <div className="grid content-start gap-4">
              <MediaField
                label="Photograph"
                value={v.imageId}
                preview={v.preview}
                onChange={(id, m) => patch(i, { imageId: id, preview: m ? { url: m.url, kind: m.kind } : null })}
              />
              <p className="text-xs text-ink/65">Use authentic photographs. Mark third-party images as “representative” in the Media library.</p>
              <Toggle checked={v.published} onChange={(x) => patch(i, { published: x })} label="Published" />
              <div className="flex gap-2">
                <Button
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const { preview: _p, ...data } = v;
                      void _p;
                      if (done(await saveVehicle(data))) router.refresh();
                    })
                  }
                >
                  Save
                </Button>
                {v.id ? (
                  <Button
                    variant="danger"
                    disabled={pending}
                    onClick={() =>
                      confirm(`Delete vehicle “${v.name}”?`) &&
                      start(async () => {
                        if (done(await deleteVehicle(v.id!), "Vehicle deleted.")) router.refresh();
                      })
                    }
                  >
                    Delete
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}
      <Button
        variant="ink"
        className="justify-self-start"
        onClick={() => setRows((r) => [...r, { name: "", vehicleClass: "", role: "", description: "", imageId: null, published: true, preview: null }])}
      >
        + Add vehicle
      </Button>
    </div>
  );
}
