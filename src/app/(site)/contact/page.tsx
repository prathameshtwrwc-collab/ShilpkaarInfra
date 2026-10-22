import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { QuoteSection } from "@/components/site/QuoteSection";
import { getMaterialOptions, getSettings } from "@/lib/content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact & Request a Quote",
  description: "Request a project-specific quotation for construction materials and transportation in the Mumbai Metropolitan Region.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [settings, materials] = await Promise.all([getSettings(), getMaterialOptions()]);
  return (
    <>
      <PageIntro index="07" label="Contact" title="Let's talk about your site.">
        {settings.contact.serviceArea}
      </PageIntro>
      <QuoteSection sections={settings.sections} contact={settings.contact} materials={materials} />
    </>
  );
}
