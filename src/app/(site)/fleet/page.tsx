import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { Fleet } from "@/components/site/Fleet";
import { QuoteSection } from "@/components/site/QuoteSection";
import { getFleet, getMaterialOptions, getSettings } from "@/lib/content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Fleet — Tippers, Multi-Axle Dumpers & Light Haulers",
  description: "Heavy tippers, multi-axle dumpers, compact tippers and cargo tempos for construction material transport across the Mumbai Metropolitan Region.",
  alternates: { canonical: "/fleet" },
};

export default async function FleetPage() {
  const [settings, fleet, materials] = await Promise.all([getSettings(), getFleet(), getMaterialOptions()]);
  return (
    <>
      <PageIntro index="04" label="Fleet" title="Matched to the load. Sized to the site.">
        {settings.sections.fleetIntro}
      </PageIntro>
      <Fleet fleet={fleet} heading={settings.sections.fleetHeading} intro="Choose a vehicle class to see what it is used for." />
      <QuoteSection sections={settings.sections} contact={settings.contact} materials={materials} />
    </>
  );
}
