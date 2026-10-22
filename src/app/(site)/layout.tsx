import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFloat } from "@/components/site/WhatsAppFloat";
import { RevealObserver } from "@/components/site/RevealObserver";
import { getServices, getSettings } from "@/lib/content";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, services] = await Promise.all([getSettings(), getServices()]);
  return (
    <>
      <Header contact={settings.contact} />
      <main id="main">{children}</main>
      <Footer settings={settings} services={services.map((s) => ({ slug: s.slug, title: s.title }))} />
      <WhatsAppFloat number={settings.contact.whatsapp} />
      <RevealObserver />
    </>
  );
}
