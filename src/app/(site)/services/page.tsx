import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { Services } from "@/components/site/Services";
import { Why } from "@/components/site/Why";
import { QuoteSection } from "@/components/site/QuoteSection";
import { getDifferentiators, getMaterialOptions, getServices, getSettings } from "@/lib/content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Services — Bulk Transport, Earth Filling, Debris & Site Logistics",
  description:
    "Bulk transportation, earth filling, debris loading and transportation, site logistics and material procurement for construction projects in the Mumbai Metropolitan Region.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const [settings, services, why, materials] = await Promise.all([getSettings(), getServices(), getDifferentiators(), getMaterialOptions()]);
  return (
    <>
      <PageIntro index="03" label="Services" title="Six services. One coordinated line.">
        From sourcing the material to moving it, placing it and clearing what is left — planned around your site.
      </PageIntro>
      <Services services={services} heading={settings.sections.servicesHeading} />
      <Why items={why} heading={settings.sections.whyHeading} />
      <QuoteSection sections={settings.sections} contact={settings.contact} materials={materials} />
    </>
  );
}
