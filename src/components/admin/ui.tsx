"use client";

import { createContext, useCallback, useContext, useState } from "react";
import clsx from "clsx";

export const inputCls =
  "w-full border border-ink/20 bg-white px-3 py-2.5 text-[0.9375rem] outline-none transition-colors placeholder:text-ink/65 hover:border-ink/40 focus:border-accent-deep focus:ring-2 focus:ring-accent/25 disabled:bg-paper-2";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("block", className)}>
      <span className="label mb-1.5 block text-ink/65">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink/65">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex min-h-10 cursor-pointer items-center gap-3 text-sm">
      <span className="relative inline-flex">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 bg-ink/20 transition-colors peer-checked:bg-ok peer-focus-visible:ring-2 peer-focus-visible:ring-accent" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
      {label}
    </label>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ink" | "ghost" | "danger" }) {
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-accent text-ink hover:bg-[#ff7d36]",
        variant === "ink" && "bg-ink text-paper hover:bg-ink-3",
        variant === "ghost" && "border border-ink/20 bg-white text-ink hover:border-ink",
        variant === "danger" && "border border-danger/40 bg-white text-danger hover:bg-danger hover:text-white",
        className,
      )}
    />
  );
}

export function Card({ title, actions, children, className }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={clsx("border border-ink/10 bg-white", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3.5">
          {title && <h2 className="display-wide text-xs">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ── Toasts ── */
type Toast = { id: number; kind: "ok" | "error"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 8000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-[100] grid w-[min(24rem,calc(100vw-2rem))] gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={clsx("border-l-4 bg-ink px-4 py-3 text-sm text-paper shadow-lg", t.kind === "ok" ? "border-ok" : "border-danger")}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** Runs a server action result through the toast system. */
export function useActionToast() {
  const toast = useToast();
  return useCallback(
    <T,>(res: { ok: true; data?: T; message?: string } | { ok: false; error: string }, okText?: string) => {
      if (res.ok) {
        if (okText ?? res.message) toast("ok", (okText ?? res.message)!);
        return true;
      }
      toast("error", res.error);
      return false;
    },
    [toast],
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW: "bg-accent text-ink",
    CONTACTED: "bg-sand/60 text-ink",
    QUOTED: "bg-ink text-paper",
    CLOSED: "bg-ink/10 text-ink/70",
  };
  return <span className={clsx("label inline-block px-2 py-1", map[status] ?? "bg-ink/10")}>{status}</span>;
}
