import type { Metadata } from "next";
import { CatalogueSection } from "@/components/site/CatalogueSection";
import { PageIntro } from "@/components/site/PageIntro";
import { QuoteSection } from "@/components/site/QuoteSection";
import { toCatalogueItems } from "@/components/site/catalogue-types";
import { getCategories, getMaterialOptions, getProducts, getSettings } from "@/lib/content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Material Catalogue — Sand, Aggregate & Earthwork",
  description:
    "River sand, M-Sand, crush sand, plaster sand, 10/20/40 mm metal, grit, stone dust, murum and earth filling material — supplied and transported across the Mumbai Metropolitan Region.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage() {
  const [settings, products, categories, materials] = await Promise.all([getSettings(), getProducts(), getCategories(), getMaterialOptions()]);
  return (
    <>
      <PageIntro index="02" label="Material catalogue" title="The material library.">
        {settings.catalogue.subcopy}
      </PageIntro>
      <CatalogueSection copy={settings.catalogue} items={toCatalogueItems(products)} categories={categories} />
      <QuoteSection sections={settings.sections} contact={settings.contact} materials={materials} />
    </>
  );
}
