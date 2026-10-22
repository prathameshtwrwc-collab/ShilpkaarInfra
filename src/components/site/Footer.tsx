import Link from "next/link";
import type { Settings } from "@/lib/settings-schema";
import { telHref, whatsappHref, whatsappMessage } from "@/lib/contact";
import { Mark } from "./Header";
import { ArrowUpRight } from "./icons";

export function Footer({ settings, services }: { settings: Settings; services: { slug: string; title: string }[] }) {
  const { contact, footer } = settings;
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-ink text-paper">
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="gutter relative grid gap-12 pt-20 pb-10 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <Mark className="h-9 w-9" />
          <p className="serif-accent mt-6 max-w-sm text-3xl leading-[1.05] text-paper md:text-4xl">{footer.tagline}</p>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-paper/60">{footer.blurb}</p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:col-span-4">
          <div>
            <p className="label mb-4 text-paper/60">Explore</p>
            <ul className="space-y-2.5 text-sm">
              {[
                ["About", "/about"],
                ["Material catalogue", "/products"],
                ["Services", "/services"],
                ["Fleet", "/fleet"],
                ["Industries", "/#industries"],
                ["Why Shilpkar", "/#why"],
                ["Contact & quote", "/contact"],
              ].map(([l, h]) => (
                <li key={h}>
                  <Link href={h} className="link-draw text-paper/80 hover:text-paper">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label mb-4 text-paper/60">Services</p>
            <ul className="space-y-2.5 text-sm">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services#${s.slug}`} className="link-draw text-paper/80 hover:text-paper">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="md:col-span-3">
          <p className="label mb-4 text-paper/60">Contact</p>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href={telHref(contact.phoneTel)} className="link-draw text-paper/80 hover:text-paper">
                {contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={whatsappHref(contact.whatsapp, whatsappMessage())} target="_blank" rel="noopener noreferrer" className="link-draw text-paper/80 hover:text-paper">
                WhatsApp {contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="link-draw break-all text-paper/80 hover:text-paper">
                {contact.email}
              </a>
            </li>
            <li className="pt-2 text-paper/55">{contact.serviceArea}</li>
          </ul>
        </div>
      </div>

      {/* Oversized wordmark sits on the "ground line" */}
      <div className="relative select-none overflow-hidden" aria-hidden="true">
        <p className="display gutter translate-y-[18%] whitespace-nowrap text-[23.5vw] leading-[0.8] text-paper/[0.06]">Shilpkar</p>
      </div>

      <div className="gutter relative flex flex-col gap-4 border-t border-paper/12 py-6 text-xs text-paper/50 md:flex-row md:items-center md:justify-between">
        <p>© {year} SHILPKAR TRANSIT INFRA LLP. All rights reserved.</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/credits" className="link-draw hover:text-paper">
            Image credits
          </Link>
          <Link href="/admin/login" className="link-draw inline-flex items-center gap-1.5 hover:text-paper" rel="nofollow">
            Sales Pipeline Login <ArrowUpRight size={10} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
