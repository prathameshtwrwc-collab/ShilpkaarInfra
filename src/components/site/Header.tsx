"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import clsx from "clsx";
import { ArrowRight, PhoneIcon, WhatsAppIcon } from "./icons";
import { telHref, whatsappHref, whatsappMessage, type ContactInfo } from "@/lib/contact";

const NAV = [
  { id: "about", label: "About", href: "/#about", page: "/about" },
  { id: "products", label: "Products", href: "/#products", page: "/products" },
  { id: "services", label: "Services", href: "/#services", page: "/services" },
  { id: "fleet", label: "Fleet", href: "/#fleet", page: "/fleet" },
  { id: "industries", label: "Industries", href: "/#industries", page: null },
  { id: "why", label: "Why Shilpkar", href: "/#why", page: null },
  { id: "contact", label: "Contact", href: "/#contact", page: "/contact" },
];

export function Header({ contact }: { contact: ContactInfo }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section tracking on the homepage.
  useEffect(() => {
    if (!isHome) {
      setActive(NAV.find((n) => n.page && pathname.startsWith(n.page))?.id ?? null);
      return;
    }
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.2, 0.5] },
    );
    sections.forEach((s) => io.observe(s));
    const onTop = () => window.scrollY < 200 && setActive(null);
    window.addEventListener("scroll", onTop, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onTop);
    };
  }, [isHome, pathname]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuBtn.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const quoteHref = isHome ? "#quote" : "/contact#quote";
  const dark = !solid && !open;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-accent focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <header
        className={clsx(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,color,border-color,backdrop-filter] duration-500",
          open ? "text-paper" : solid ? "border-b border-ink/10 bg-paper/92 text-ink backdrop-blur-md" : "border-b border-transparent text-paper",
        )}
      >
        <div className="gutter flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link href="/" className="group relative z-[60] flex items-center gap-3" aria-label="SHILPKAR TRANSIT INFRA LLP — home">
            <Mark className="h-7 w-7 shrink-0" />
            <span className="leading-none">
              <span className="display-wide block text-[0.95rem] tracking-[0.18em]">Shilpkar</span>
              <span className="label mt-1 block text-[0.5rem] tracking-[0.3em] opacity-70">Transit Infra LLP</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1 xl:gap-2">
              {NAV.map((n, i) => (
                <li key={n.id}>
                  <Link
                    href={isHome ? `#${n.id}` : (n.page ?? n.href)}
                    className="group relative flex items-baseline gap-1.5 px-2.5 py-2 text-[0.8125rem] font-medium"
                    aria-current={active === n.id ? "true" : undefined}
                  >
                    <span
                      className={clsx(
                        "font-mono text-[0.5625rem] transition-opacity",
                        active === n.id ? (dark ? "text-accent" : "text-accent-deep") : "opacity-70",
                      )}
                    >
                      0{i + 1}
                    </span>
                    <span className="opacity-90 transition-opacity group-hover:opacity-100">{n.label}</span>
                    {active === n.id && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute inset-x-2.5 -bottom-0.5 h-px bg-accent"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }}
                      />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="relative z-[60] flex items-center gap-2">
            <a
              href={telHref(contact.phoneTel)}
              className={clsx(
                "hidden h-10 items-center gap-2 px-3 text-[0.8125rem] font-medium md:flex",
                dark ? "text-paper/85 hover:text-paper" : "text-ink/80 hover:text-ink",
              )}
            >
              <PhoneIcon size={14} />
              <span className="hidden xl:inline">{contact.phoneDisplay}</span>
              <span className="xl:hidden">Call</span>
            </a>
            <Link href={quoteHref} className="btn btn-primary hidden min-h-10 sm:inline-flex">
              Get a Quote <ArrowRight size={14} />
            </Link>
            <button
              ref={menuBtn}
              type="button"
              className="flex h-11 w-11 items-center justify-center lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              <span className="relative block h-3 w-6">
                <span className={clsx("absolute left-0 top-0 h-px w-6 bg-current transition-transform duration-500", open && "translate-y-1.5 rotate-45")} />
                <span className={clsx("absolute bottom-0 left-0 h-px w-6 bg-current transition-transform duration-500", open && "-translate-y-1.5 -rotate-45")} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-ink text-paper lg:hidden"
            initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
            exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="tech-grid pointer-events-none absolute inset-0 opacity-50" />
            <nav aria-label="Mobile" className="gutter relative flex-1 pt-[calc(var(--header-h)+1.5rem)]">
              <ul className="border-t border-paper/15">
                {NAV.map((n, i) => (
                  <motion.li
                    key={n.id}
                    initial={reduce ? false : { opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-paper/15"
                  >
                    <Link
                      href={n.page ?? n.href}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline justify-between py-3.5"
                    >
                      <span className="display text-[2.4rem] leading-none xs:text-5xl">{n.label}</span>
                      <span className="label text-paper/60">0{i + 1}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <div className="gutter relative grid gap-3 pb-8 pt-8">
              <Link href={quoteHref} onClick={() => setOpen(false)} className="btn btn-primary min-h-14 w-full text-sm">
                Request a Project Quote <ArrowRight />
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <a href={whatsappHref(contact.whatsapp, whatsappMessage())} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-dark min-h-12 justify-center gap-2">
                  <WhatsAppIcon size={16} /> WhatsApp
                </a>
                <a href={telHref(contact.phoneTel)} className="btn btn-ghost-dark min-h-12 justify-center gap-2">
                  <PhoneIcon size={15} /> Call
                </a>
              </div>
              <p className="label mt-2 text-paper/60">Mumbai Metropolitan Region</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Brand mark: a stockpile cross-section over a haul line. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="0.75" y="0.75" width="30.5" height="30.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 22L13 10l5 6 3-3.5L27 22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="bevel" />
      <path d="M5 26.5h22" stroke="#f06a1f" strokeWidth="2.5" />
    </svg>
  );
}
