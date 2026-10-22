/* Idempotent seed: safe to run repeatedly. Creates catalogue, services,
 * fleet, industries, differentiators and the bundled (licensed) imagery.
 * Existing records are matched by slug/url and only created when missing,
 * so content edited in the admin panel is never overwritten. */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const db = new PrismaClient();

type SeedMedia = {
  url: string;
  width: number;
  height: number;
  size: number;
  credit: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};
const manifest: Record<string, SeedMedia> = JSON.parse(
  fs.readFileSync(path.join(__dirname, "seed-media.json"), "utf8"),
);

const ALT: Record<string, string> = {
  "hero-tippers": "Tata heavy tippers marked M-Sand standing on red earth at an active construction site",
  "river-sand": "Close-up of natural river sand",
  "river-sand-deposits": "River sand deposits stockpiled on a riverbank in Karnataka",
  "m-sand": "Stockpile of grey manufactured sand (M-Sand)",
  "m-sand-stockpile": "M-Sand stockpile at a supply yard in Tamil Nadu",
  "crush-sand": "Fine crushed-stone sand with a smooth worked face",
  "plaster-sand": "Heap of fine plaster sand on site",
  "aggregate-10mm": "Handful of 10 mm crushed stone aggregate",
  "aggregate-20mm": "Handful of 20 mm crushed stone aggregate",
  "metal-stones": "Pile of crushed stone metal at a construction site in India",
  "aggregate-40mm": "Large angular crushed stone aggregate",
  grit: "Graded basalt chippings at a quarry",
  "stone-dust": "Pile of fine white quarry stone dust",
  murum: "Close-up of reddish laterite murum-type gravel",
  "murum-road": "Compacted laterite road surface",
  "earth-filling": "Tipper loaded with earth while a loader places fill on site",
  "bulk-transport": "Loaded tipper truck carrying sand and soil along a highway",
  "earthwork-excavator": "Tata Hitachi excavator working on red earth",
  "debris-loading": "Excavators breaking and loading rubble beside a building under construction",
  "debris-transport": "Excavator loading excavated material into a tipper",
  "metro-corridor": "Barricaded Mumbai Metro construction corridor with graded earth",
  stockpiles: "Graded stone stockpiles at a quarry yard",
  "fleet-tata-407-dumper": "Yellow Tata compact tipper",
  "fleet-tata-ace": "Tata Ace light commercial vehicle loaded with pipes and water tanks",
  "mumbai-towers": "High-rise towers and cranes rising above a Mumbai railway line",
  "sealink-construction": "Bandra-Worli Sea Link under construction at sunset",
  "mumbai-redevelopment": "Mumbai building wrapped in bamboo scaffolding during redevelopment",
};

async function media(key: string) {
  const m = manifest[key];
  if (!m) throw new Error(`Missing seed media ${key}`);
  const existing = await db.media.findFirst({ where: { url: m.url } });
  if (existing) return existing.id;
  const row = await db.media.create({
    data: {
      kind: "IMAGE",
      url: m.url,
      mime: "image/webp",
      size: m.size,
      width: m.width,
      height: m.height,
      alt: ALT[key] ?? "",
      credit: m.credit,
      license: m.license,
      licenseUrl: m.licenseUrl || null,
      sourceUrl: m.sourceUrl,
      representative: true,
    },
  });
  return row.id;
}

const CATEGORIES = [
  { name: "Sand", slug: "sand" },
  { name: "Aggregate", slug: "aggregate" },
  { name: "Earthwork", slug: "earthwork" },
];

const PRODUCTS: {
  slug: string;
  name: string;
  cat: string;
  summary: string;
  description: string;
  applications: string[];
  cover: string;
  gallery?: string[];
  featured?: boolean;
  focal?: [number, number];
}[] = [
  {
    slug: "river-sand", name: "River Sand", cat: "sand", featured: true,
    summary: "Natural river sand suitable for concrete, plaster and masonry work where specified.",
    description: "Natural river sand for projects where the specification calls for it. Supplied and transported to site against your required quantity and delivery schedule.",
    applications: ["Concrete", "Plaster", "Masonry work"],
    cover: "river-sand", gallery: ["river-sand-deposits"],
  },
  {
    slug: "m-sand", name: "M-Sand", cat: "sand", featured: true,
    summary: "Manufactured sand, a consistent crushed-stone alternative for concrete and blockwork.",
    description: "Manufactured sand produced by crushing stone — a consistent alternative to natural sand for concrete and blockwork. Supplied to project requirements.",
    applications: ["Concrete", "Blockwork"],
    cover: "m-sand", gallery: ["m-sand-stockpile"],
  },
  {
    slug: "crush-sand", name: "Crush Sand", cat: "sand",
    summary: "Crushed sand graded for concreting and construction applications.",
    description: "Crushed sand graded for concreting and general construction applications, supplied and delivered to your site schedule.",
    applications: ["Concreting", "General construction"],
    cover: "crush-sand",
  },
  {
    slug: "plaster-sand", name: "Plaster Sand", cat: "sand",
    summary: "Fine sand for plastering and finishing work.",
    description: "Fine sand for internal and external plastering and finishing work, delivered in quantities matched to your plastering programme.",
    applications: ["Plastering", "Finishing work"],
    cover: "plaster-sand", focal: [50, 60],
  },
  {
    slug: "10-mm-metal", name: "10 MM Metal", cat: "aggregate",
    summary: "10 mm crushed stone aggregate for concrete mixes and fine works.",
    description: "10 mm crushed stone aggregate for concrete mixes and finer works. Supplied to project specifications.",
    applications: ["Concrete mixes", "Fine works"],
    cover: "aggregate-10mm",
  },
  {
    slug: "20-mm-metal", name: "20 MM Metal", cat: "aggregate", featured: true,
    summary: "20 mm crushed stone aggregate, commonly used for RCC and general concreting.",
    description: "20 mm crushed stone aggregate, commonly used for RCC and general concreting. Bulk quantities moved by heavy tipper.",
    applications: ["RCC work", "General concreting"],
    cover: "aggregate-20mm", gallery: ["metal-stones"],
  },
  {
    slug: "40-mm-metal", name: "40 MM Metal", cat: "aggregate",
    summary: "40 mm crushed stone aggregate for heavy foundations and base works.",
    description: "40 mm crushed stone aggregate for heavy foundations and base works, supplied and transported as per site requirements.",
    applications: ["Heavy foundations", "Base works"],
    cover: "aggregate-40mm",
  },
  {
    slug: "grit", name: "Grit", cat: "aggregate",
    summary: "Graded grit for concrete, flooring and construction applications.",
    description: "Graded grit for concrete, flooring and other construction applications.",
    applications: ["Concrete", "Flooring", "Construction applications"],
    cover: "grit",
  },
  {
    slug: "stone-dust", name: "Stone Dust", cat: "aggregate",
    summary: "Fine stone dust for paving, filling and base preparation.",
    description: "Fine stone dust for paving, filling and base preparation works.",
    applications: ["Paving", "Filling", "Base preparation"],
    cover: "stone-dust", focal: [50, 75],
  },
  {
    slug: "murum", name: "Murum", cat: "earthwork", featured: true,
    summary: "Murum for site levelling, road sub-base and earth filling works.",
    description: "Murum supplied for site levelling, road sub-base and earth filling works, transported by tipper or multi-axle dumper depending on volume.",
    applications: ["Site levelling", "Road sub-base", "Earth filling"],
    cover: "murum-road", gallery: ["murum"],
  },
  {
    slug: "earth-filling-material", name: "Earth Filling Material", cat: "earthwork",
    summary: "Earth filling material supplied and transported as per site requirements.",
    description: "Earth filling material supplied and transported as per site requirements, with placement available through our earth filling service.",
    applications: ["Earth filling", "Site requirements"],
    cover: "earth-filling", focal: [40, 55],
  },
];

const SERVICES = [
  { slug: "bulk-transportation", title: "Bulk Transportation", image: "bulk-transport",
    summary: "Bulk movement of construction materials to site with a mixed tipper and dumper fleet.",
    detail: "Sand, aggregates and earthwork materials moved in the vehicle class that suits the load and the site — from heavy tippers on open sites to compact vehicles for constrained access." },
  { slug: "earth-filling", title: "Earth Filling", image: "earthwork-excavator",
    summary: "Supply and placement of earth and murum for site levelling and filling.",
    detail: "Earth and murum supplied and placed for levelling and filling, scheduled around the stage your site is at." },
  { slug: "debris-loading", title: "Debris Loading", image: "debris-loading",
    summary: "Mechanised loading of construction debris and excavated material at site.",
    detail: "Mechanised loading of construction debris and excavated material, coordinated with transport so the site stays clear." },
  { slug: "debris-transportation", title: "Debris Transportation", image: "debris-transport",
    summary: "Transportation and disposal of debris and surplus material from project sites.",
    detail: "Movement of debris and surplus material away from project sites. Disposal destinations are agreed per project." },
  { slug: "site-logistics", title: "Site Logistics", image: "metro-corridor",
    summary: "Coordinated material scheduling and movement to keep your site running.",
    detail: "Material deliveries sequenced against your programme, so the right load reaches the right part of the site when it is needed." },
  { slug: "material-procurement", title: "Material Procurement", image: "stockpiles",
    summary: "Sourcing and procurement of project-specific construction materials.",
    detail: "Sourcing of the sands, aggregates and earthwork materials your specification calls for — including project-specific materials on request." },
];

const FLEET = [
  { name: "Tata 2528", vehicleClass: "Heavy Tipper", role: "Bulk sand and 20/40 mm aggregate transit.", image: "hero-tippers" as string | null,
    description: "The workhorse for bulk sand and aggregate movement between source and site." },
  { name: "Tata 4825", vehicleClass: "Multi-Axle Dumper", role: "Heavy earth filling and infrastructure aggregates.", image: null,
    description: "Multi-axle capacity for heavy earth filling and infrastructure-scale aggregate supply." },
  { name: "Tata 610", vehicleClass: "Compact Tipper", role: "Tight urban and redevelopment sites.", image: "fleet-tata-407-dumper",
    description: "A compact tipper for narrow approaches, dense neighbourhoods and redevelopment plots." },
  { name: "Cargo Tempos", vehicleClass: "Light Haulers", role: "Urgent finishing material supplies.", image: "fleet-tata-ace",
    description: "Light, quick vehicles for urgent top-ups of finishing materials." },
];

const INDUSTRIES = [
  ["Builders and Developers", "Residential and commercial developments from excavation to finishing."],
  ["Civil Contractors", "Material supply aligned to civil work packages."],
  ["RCC Contractors", "Sand and aggregate supply for structural concreting."],
  ["Infrastructure Contractors", "Volume aggregates and earthwork for infrastructure works."],
  ["Industrial Projects", "Earthwork and materials for industrial sites."],
  ["Warehouses", "Site development, filling and base materials for logistics facilities."],
  ["Redevelopment Projects", "Compact vehicles and debris handling for dense urban plots."],
  ["Residential Construction", "Materials for housing, from foundation to plaster."],
  ["Commercial Construction", "Scheduled supply for commercial building programmes."],
  ["Site Development", "Levelling, filling and preparation of new sites."],
];

const DIFFERENTIATORS = [
  ["Material + Transportation", "Material supply and transportation coordinated together."],
  ["Project-Oriented Service", "Service structured around project requirements."],
  ["Flexible Delivery", "Delivery scheduling adapted to site timelines."],
  ["Single-Window Coordination", "One point of contact for material, transport and site logistics."],
  ["B2B Focus", "Built for builders, contractors and industrial projects."],
  ["Responsive Service", "Enquiry handling and dispatch coordination."],
];

async function main() {
  const catIds: Record<string, string> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await db.category.upsert({ where: { slug: c.slug }, create: { ...c, order: i }, update: {} });
    catIds[c.slug] = row.id;
  }

  for (const [i, p] of PRODUCTS.entries()) {
    if (await db.product.findUnique({ where: { slug: p.slug } })) continue;
    const coverId = await media(p.cover);
    const product = await db.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        categoryId: catIds[p.cat],
        summary: p.summary,
        description: p.description,
        applications: JSON.stringify(p.applications),
        featured: !!p.featured,
        order: i,
        coverId,
        focalX: p.focal?.[0] ?? 50,
        focalY: p.focal?.[1] ?? 50,
      },
    });
    for (const [j, g] of [p.cover, ...(p.gallery ?? [])].entries()) {
      await db.productImage.create({ data: { productId: product.id, mediaId: await media(g), order: j } });
    }
  }

  for (const [i, s] of SERVICES.entries()) {
    if (await db.service.findUnique({ where: { slug: s.slug } })) continue;
    await db.service.create({
      data: { slug: s.slug, title: s.title, summary: s.summary, detail: s.detail, order: i, imageId: await media(s.image) },
    });
  }

  if ((await db.fleetVehicle.count()) === 0) {
    for (const [i, f] of FLEET.entries()) {
      await db.fleetVehicle.create({
        data: {
          name: f.name,
          vehicleClass: f.vehicleClass,
          role: f.role,
          description: f.description,
          order: i,
          imageId: f.image ? await media(f.image) : null,
        },
      });
    }
  }

  if ((await db.industry.count()) === 0) {
    await db.industry.createMany({ data: INDUSTRIES.map(([name, note], order) => ({ name, note, order })) });
  }
  if ((await db.differentiator.count()) === 0) {
    await db.differentiator.createMany({ data: DIFFERENTIATORS.map(([title, body], order) => ({ title, body, order })) });
  }

  // Page imagery lives in settings; only set when not already configured.
  const settingMedia: Record<string, Record<string, string>> = {
    hero: { imageId: "hero-tippers" },
    about: { imageId: "mumbai-towers", secondaryImageId: "sealink-construction" },
    sections: { industriesImageId: "mumbai-redevelopment" },
  };
  const { SETTING_DEFAULTS } = await import("../src/lib/settings-schema");
  for (const [key, fields] of Object.entries(settingMedia)) {
    if (await db.siteSetting.findUnique({ where: { key } })) continue;
    const value = { ...(SETTING_DEFAULTS as Record<string, object>)[key] } as Record<string, unknown>;
    for (const [field, mediaKey] of Object.entries(fields)) value[field] = await media(mediaKey);
    await db.siteSetting.create({ data: { key, value: JSON.stringify(value) } });
  }

  // Remaining bundled images go into the media library for reuse.
  for (const key of Object.keys(manifest)) await media(key);

  console.log("Seed complete:", {
    products: await db.product.count(),
    services: await db.service.count(),
    fleet: await db.fleetVehicle.count(),
    media: await db.media.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
