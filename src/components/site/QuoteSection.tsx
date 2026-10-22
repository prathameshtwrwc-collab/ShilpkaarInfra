import { Suspense } from "react";
import type { Settings } from "@/lib/settings-schema";
import { telHref, whatsappHref, whatsappMessage } from "@/lib/contact";
import { QuoteForm } from "./QuoteForm";
import { hasDatabase } from "@/lib/mode";
import { RiseHeading, SectionLabel } from "./SectionHead";
import { ArrowUpRight, MailIcon, PhoneIcon, WhatsAppIcon } from "./icons";

type Props = {
  sections: Settings["sections"];
  contact: Settings["contact"];
  materials: { slug: string; name: string; category: string }[];
  headingAs?: "h1" | "h2";
  defaultMaterial?: string;
};

export function QuoteSection({ sections, contact, materials, headingAs = "h2", defaultMaterial }: Props) {
  const actions = [
    { icon: <PhoneIcon size={18} />, label: "Call", value: contact.phoneDisplay, href: telHref(contact.phoneTel), external: false },
    {
      icon: <WhatsAppIcon size={19} />,
      label: "WhatsApp",
      value: contact.phoneDisplay,
      href: whatsappHref(contact.whatsapp, whatsappMessage()),
      external: true,
    },
    { icon: <MailIcon size={18} />, label: "Email", value: contact.email, href: `mailto:${contact.email}`, external: false },
  ];

  return (
    <section id="contact" data-hide-float aria-labelledby="quote-heading" className="relative bg-paper-2 py-24 text-ink md:py-36">
      <div className="gutter grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <SectionLabel index="07" tone="light" className="text-ink/70">
            Contact &amp; quotation
          </SectionLabel>
          <div id="quote-heading" className="mt-8">
            <RiseHeading as={headingAs} text={sections.quoteHeading} className="text-[clamp(3rem,7vw,7.5rem)]" />
          </div>
          <p data-reveal className="mt-8 max-w-md text-lg leading-relaxed text-ink/75">
            {sections.quoteIntro}
          </p>

          <ul className="mt-12 border-t border-ink/15">
            {actions.map((a) => (
              <li key={a.label} className="border-b border-ink/15">
                <a
                  href={a.href}
                  {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex min-h-16 items-center gap-4 py-4 transition-colors hover:text-accent-deep"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center bg-ink text-paper transition-colors group-hover:bg-accent group-hover:text-ink">
                    {a.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="label block text-ink/65">{a.label}</span>
                    <span className="block truncate text-lg font-medium">{a.value}</span>
                  </span>
                  <ArrowUpRight className="opacity-40 transition-opacity group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-sm text-sm leading-relaxed text-ink/70">
            <span className="label mb-2 block text-ink/65">Service area</span>
            {contact.serviceArea}
          </p>
        </div>

        <div id="quote" className="scroll-mt-28 lg:col-span-7 lg:pl-8">
          <div className="border-t-[3px] border-ink pt-8">
            <p className="label mb-8 flex items-center justify-between text-ink/65">
              <span>Project quotation form</span>
              <span>Fields marked * are required</span>
            </p>
            <Suspense fallback={<div className="h-[36rem]" />}>
              <QuoteForm materials={materials} whatsapp={contact.whatsapp} defaultMaterial={defaultMaterial} online={hasDatabase} />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
