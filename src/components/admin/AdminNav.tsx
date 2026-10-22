"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { logout } from "@/app/admin/actions/auth";
import { Mark } from "@/components/site/Header";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/fleet", label: "Fleet" },
  { href: "/admin/content", label: "Page content" },
  { href: "/admin/media", label: "Media library" },
];

export function AdminNav({ name, email, newCount }: { name: string; email: string; newCount: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <aside className="sticky top-0 z-40 bg-ink text-paper lg:h-screen">
      <div className="flex h-14 items-center justify-between px-4 lg:h-auto lg:flex-col lg:items-start lg:px-5 lg:pt-6">
        <Link href="/admin" className="flex items-center gap-3">
          <Mark className="h-7 w-7" />
          <span>
            <span className="display-wide block text-[0.8rem] tracking-[0.16em]">Shilpkar</span>
            <span className="label block text-[0.5rem] text-paper/50">Sales pipeline</span>
          </span>
        </Link>
        <button type="button" className="label px-2 py-2 lg:hidden" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <nav aria-label="Admin" className={clsx("px-3 pb-4 lg:mt-8 lg:block", open ? "block" : "hidden")}>
        <ul className="grid gap-0.5">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={clsx(
                  "flex min-h-10 items-center justify-between px-3 text-sm transition-colors",
                  isActive(l.href) ? "bg-paper/10 text-paper" : "text-paper/65 hover:bg-paper/5 hover:text-paper",
                )}
              >
                {l.label}
                {l.href === "/admin/enquiries" && newCount > 0 && <span className="bg-accent px-1.5 font-mono text-[0.625rem] text-ink">{newCount}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-paper/10 px-3 pt-4 lg:absolute lg:bottom-6 lg:left-3 lg:right-3">
          <p className="truncate text-sm">{name}</p>
          <p className="truncate text-xs text-paper/50">{email}</p>
          <div className="mt-3 flex gap-4 text-xs">
            <Link href="/" target="_blank" className="text-paper/60 underline-offset-2 hover:text-paper hover:underline">
              View site ↗
            </Link>
            <form action={logout}>
              <button type="submit" className="text-paper/60 underline-offset-2 hover:text-paper hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>
    </aside>
  );
}
