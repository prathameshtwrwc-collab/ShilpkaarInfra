import Image from "next/image";
import Link from "next/link";
import type { MediaView } from "@/lib/content";
import type { Settings } from "@/lib/settings-schema";
import { telHref, whatsappHref, whatsappMessage } from "@/lib/contact";
import { ArrowRight, Crosshair, PhoneIcon, WhatsAppIcon } from "./icons";
import { HeroDepth, HeroVideo } from "./HeroClient";

type Props = {
  hero: Settings["hero"];
  contact: Settings["contact"];
  image: MediaView | null;
  mobileImage: MediaView | null;
  video: MediaView | null;
  materials: string[];
};

export function Hero({ hero, contact, image, mobileImage, video, materials }: Props) {
  const ticker = [...materials, ...materials];
  return (
    <section id="top" aria-label="Introduction" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink text-paper">
      {/* ── Background plate ── */}
      <HeroDepth>
        <div className="hero-zoom absolute inset-0" data-hero-plate>
          {image && (
            <Image
              src={image.url}
              alt={image.alt}
              fill
              priority
              sizes="100vw"
              className={mobileImage ? "hidden object-cover md:block" : "object-cover object-[74%_68%] md:object-[60%_55%]"}
            />
          )}
          {mobileImage && (
            <Image src={mobileImage.url} alt={mobileImage.alt} fill priority sizes="100vw" className="object-cover md:hidden" />
          )}
          {video && <HeroVideo src={video.url} poster={image?.url} />}
        </div>
      </HeroDepth>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(15,15,14,0.92)_0%,rgba(15,15,14,0.72)_38%,rgba(15,15,14,0.2)_70%,rgba(15,15,14,0.35)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[linear-gradient(0deg,rgba(15,15,14,0.96)_8%,rgba(15,15,14,0)_100%)]" />
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="grain pointer-events-none absolute inset-0" />

      {/* ── Technical index, top right ── */}
      <div className="gutter pointer-events-none relative hidden pt-[calc(var(--header-h)+2rem)] md:block">
        <div className="hero-fade ml-auto flex w-fit items-start gap-10 text-paper/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]" style={{ ["--d" as string]: "1.1s" }}>
          <dl className="label space-y-1.5 text-right">
            <dt className="text-paper/55">Fig. 01</dt>
            <dd>Earthwork — active site</dd>
          </dl>
          <dl className="label space-y-1.5">
            <dt className="flex items-center gap-2 text-accent">
              <Crosshair size={12} /> Service area
            </dt>
            <dd>Mumbai Metropolitan Region</dd>
            <dd className="text-paper/60">19.0760° N · 72.8777° E</dd>
          </dl>
        </div>
      </div>

      {/* ── Route line: source → site ── */}
      <div aria-hidden="true" className="pointer-events-none absolute right-[var(--gutter)] top-[26%] bottom-[48%] hidden w-px xl:block">
        <div className="hero-vline absolute inset-0 bg-gradient-to-b from-paper/0 via-paper/40 to-accent" />
        {["Source", "Transport", "Site"].map((s, i) => (
          <div key={s} className="hero-fade absolute -left-[3px] flex items-center gap-3" style={{ top: `${i * 50}%`, ["--d" as string]: `${1.2 + i * 0.15}s` }}>
            <span className={i === 2 ? "h-[7px] w-[7px] bg-accent" : "h-[7px] w-[7px] border border-paper/70 bg-ink"} />
            <span className="label absolute right-5 whitespace-nowrap text-paper/55">
              0{i + 1} {s}
            </span>
          </div>
        ))}
      </div>

      {/* ── Headline + actions ── */}
      <div className="gutter relative mt-auto grid gap-8 pb-8 pt-32 md:pb-10 lg:grid-cols-12 lg:items-end lg:gap-6">
        <div className="lg:col-span-8" data-hero-copy>
          <p className="hero-fade label mb-5 flex items-center gap-3 text-paper/70" style={{ ["--d" as string]: "0.2s" }}>
            <span className="h-px w-8 bg-accent" />
            Construction materials · Bulk transport · Site logistics
          </p>
          <h1 className="display hero-line text-[clamp(3.4rem,12.4vw,6rem)] md:text-[clamp(5rem,9.6vw,11.5rem)]">
            {hero.headlineLines.map((l, i) => (
              <span key={i}>
                <span style={{ ["--i" as string]: i }} className={i === hero.accentLine ? "serif-accent pr-[0.06em] text-accent" : undefined}>
                  {l}
                </span>{" "}
              </span>
            ))}
          </h1>
        </div>

        <div className="lg:col-span-4 lg:pb-3">
          <p className="hero-fade max-w-md text-[1.0625rem] leading-relaxed text-paper/80 md:text-lg" style={{ ["--d" as string]: "0.85s" }}>
            {hero.subcopy}
          </p>
          <div className="hero-fade mt-7 flex flex-col gap-3" style={{ ["--d" as string]: "1s" }}>
            <Link href="#quote" className="btn btn-primary min-h-14 w-full text-sm sm:w-auto sm:max-w-sm">
              Request a Project Quote <ArrowRight />
            </Link>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a
                href={whatsappHref(contact.whatsapp, whatsappMessage())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-paper/85 hover:text-paper"
              >
                <WhatsAppIcon size={17} /> <span className="link-draw">WhatsApp us</span>
              </a>
              <a href={telHref(contact.phoneTel)} className="inline-flex min-h-11 items-center gap-2 text-paper/85 hover:text-paper">
                <PhoneIcon size={15} /> <span className="link-draw">Call {contact.phoneDisplay}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Material ticker + scroll cue ── */}
      <div className="relative border-t border-paper/12">
        <div className="flex items-stretch">
          <a href="#about" className="label hidden shrink-0 items-center gap-3 border-r border-paper/12 px-[var(--gutter)] text-paper/60 hover:text-paper md:flex">
            <span className="relative block h-6 w-px overflow-hidden bg-paper/20">
              <span className="scroll-cue absolute inset-x-0 top-0 h-2 bg-accent" />
            </span>
            Scroll
          </a>
          <div className="relative flex-1 overflow-hidden py-3.5" aria-label="Materials supplied">
            <ul className="marquee-track flex w-max gap-10 pl-6 text-paper/55">
              {ticker.map((m, i) => (
                <li key={i} aria-hidden={i >= materials.length} className="label flex items-center gap-10 whitespace-nowrap">
                  {m}
                  <span className="h-1 w-1 bg-accent/80" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
