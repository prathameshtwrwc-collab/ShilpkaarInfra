import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { CatalogueSection } from "@/components/site/CatalogueSection";
import { Services } from "@/components/site/Services";
import { Fleet } from "@/components/site/Fleet";
import { Industries } from "@/components/site/Industries";
import { Why } from "@/components/site/Why";
import { QuoteSection } from "@/components/site/QuoteSection";
import { toCatalogueItems } from "@/components/site/catalogue-types";
import {
  getCategories,
  getDifferentiators,
  getFleet,
  getIndustries,
  getMaterialOptions,
  getMediaMap,
  getProducts,
  getServices,
  getSettings,
} from "@/lib/content";

export const revalidate = 300;

export default async function HomePage() {
  const settings = await getSettings();
  const [products, categories, services, fleet, industries, why, materials, mediaMap] = await Promise.all([
    getProducts(),
    getCategories(),
    getServices(),
    getFleet(),
    getIndustries(),
    getDifferentiators(),
    getMaterialOptions(),
    getMediaMap([
      settings.hero.imageId,
      settings.hero.mobileImageId,
      settings.hero.videoId,
      settings.about.imageId,
      settings.about.secondaryImageId,
      settings.sections.industriesImageId,
    ]),
  ]);
  const m = (id: string | null) => (id ? (mediaMap.get(id) ?? null) : null);
  const video = m(settings.hero.videoId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "SHILPKAR TRANSIT INFRA LLP",
    description: settings.footer.blurb,
    telephone: settings.contact.phoneTel,
    email: settings.contact.email,
    areaServed: "Mumbai Metropolitan Region",
    image: "/images/seed/hero-tippers.webp",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero
        hero={settings.hero}
        contact={settings.contact}
        image={m(settings.hero.imageId)}
        mobileImage={m(settings.hero.mobileImageId)}
        video={video?.kind === "VIDEO" ? video : null}
        materials={products.map((p) => p.name)}
      />
      <About about={settings.about} stats={settings.stats} image={m(settings.about.imageId)} secondary={m(settings.about.secondaryImageId)} />
      <CatalogueSection copy={settings.catalogue} items={toCatalogueItems(products)} categories={categories} />
      <Services services={services} heading={settings.sections.servicesHeading} />
      <Fleet fleet={fleet} heading={settings.sections.fleetHeading} intro={settings.sections.fleetIntro} />
      <Industries industries={industries} heading={settings.sections.industriesHeading} image={m(settings.sections.industriesImageId)} />
      <Why items={why} heading={settings.sections.whyHeading} />
      <QuoteSection sections={settings.sections} contact={settings.contact} materials={materials} />
    </>
  );
}
