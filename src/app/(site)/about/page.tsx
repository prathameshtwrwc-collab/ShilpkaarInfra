import type { Metadata } from "next";
import { About } from "@/components/site/About";
import { Industries } from "@/components/site/Industries";
import { Why } from "@/components/site/Why";
import { QuoteSection } from "@/components/site/QuoteSection";
import { getDifferentiators, getIndustries, getMaterialOptions, getMediaMap, getSettings } from "@/lib/content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About — From Material Source to Active Site",
  description:
    "SHILPKAR TRANSIT INFRA LLP coordinates construction material procurement, bulk transportation, earth filling, debris management and site logistics across the Mumbai Metropolitan Region.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const settings = await getSettings();
  const [industries, why, materials, media] = await Promise.all([
    getIndustries(),
    getDifferentiators(),
    getMaterialOptions(),
    getMediaMap([settings.about.imageId, settings.about.secondaryImageId, settings.sections.industriesImageId]),
  ]);
  const m = (id: string | null) => (id ? (media.get(id) ?? null) : null);
  return (
    <div className="pt-[var(--header-h)] bg-ink">
      <About
        about={settings.about}
        stats={settings.stats}
        image={m(settings.about.imageId)}
        secondary={m(settings.about.secondaryImageId)}
        headingAs="h1"
      />
      <Industries industries={industries} heading={settings.sections.industriesHeading} image={m(settings.sections.industriesImageId)} />
      <Why items={why} heading={settings.sections.whyHeading} />
      <QuoteSection sections={settings.sections} contact={settings.contact} materials={materials} />
    </div>
  );
}
