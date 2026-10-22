import { z } from "zod";
import { DEFAULT_CONTACT } from "./contact";

// Editable site copy. Each key is stored as JSON in SiteSetting and validated
// with these schemas on save. Defaults keep the site intact on a fresh DB.

const line = (max = 200) => z.string().trim().min(1).max(max);
const mediaRef = z.string().trim().max(40).nullable();

export const settingSchemas = {
  hero: z.object({
    headlineLines: z.array(line(40)).min(1).max(6),
    accentLine: z.number().int().min(0).max(5),
    subcopy: line(320),
    imageId: mediaRef,
    mobileImageId: mediaRef,
    videoId: mediaRef,
  }),
  about: z.object({
    heading: line(80),
    intro: line(600),
    statements: z.array(line(160)).max(6),
    steps: z.array(z.object({ title: line(60), body: line(240) })).min(1).max(6),
    imageId: mediaRef,
    secondaryImageId: mediaRef,
  }),
  stats: z.array(z.object({ value: line(16), label: line(48) })).max(6),
  catalogue: z.object({ heading: line(60), subcopy: line(240), note: line(200) }),
  sections: z.object({
    servicesHeading: line(80),
    fleetHeading: line(80),
    fleetIntro: line(320),
    industriesHeading: line(80),
    whyHeading: line(80),
    quoteHeading: line(80),
    quoteIntro: line(320),
    industriesImageId: mediaRef,
  }),
  contact: z.object({
    phoneDisplay: line(30),
    phoneTel: z.string().trim().regex(/^\+?\d{8,15}$/, "Digits only, optionally starting with +"),
    whatsapp: z.string().trim().regex(/^\d{8,15}$/, "International format digits, e.g. 919876543210"),
    email: z.email(),
    serviceArea: line(240),
  }),
  footer: z.object({ tagline: line(80), blurb: line(320) }),
};

export type SettingKey = keyof typeof settingSchemas;
export type Settings = { [K in SettingKey]: z.infer<(typeof settingSchemas)[K]> };

export const SETTING_DEFAULTS: Settings = {
  hero: {
    headlineLines: ["We move", "the materials", "that build", "the city."],
    accentLine: 3,
    subcopy:
      "Construction materials, bulk transportation and site logistics — coordinated for projects across the Mumbai Metropolitan Region.",
    imageId: null,
    mobileImageId: null,
    videoId: null,
  },
  about: {
    heading: "From material source to active site.",
    intro:
      "SHILPKAR TRANSIT INFRA LLP brings construction material procurement, bulk transportation, earth filling, debris management and site logistics together under a coordinated service for projects across the Mumbai Metropolitan Region.",
    statements: [
      "Material and movement, planned together.",
      "Sized to the site, not the other way round.",
      "One coordinated line from source to slab.",
    ],
    steps: [
      { title: "Source the material", body: "Sands, aggregates and earthwork materials procured to the grade your project specifies." },
      { title: "Coordinate transportation", body: "The right vehicle class matched to the load, the route and the site's access." },
      { title: "Deliver to the project site", body: "Dispatch scheduled around your pour, plaster or filling programme." },
      { title: "Support ongoing site requirements", body: "Repeat supply, earth filling and debris movement as the project progresses." },
    ],
    imageId: null,
    secondaryImageId: null,
  },
  stats: [
    { value: "11+", label: "Listed material grades" },
    { value: "6", label: "Core services" },
    { value: "4", label: "Listed fleet classes" },
    { value: "MMR", label: "Mumbai Metropolitan Region" },
  ],
  catalogue: {
    heading: "Choose your material.",
    subcopy: "Explore sands, aggregates and earthwork materials supplied to project specifications.",
    note: "Additional project-specific materials can be sourced on request.",
  },
  sections: {
    servicesHeading: "The movement behind every project.",
    fleetHeading: "The right vehicle for the job.",
    fleetIntro:
      "Four listed vehicle classes — from multi-axle dumpers for heavy earthwork to compact tippers and tempos for tight urban sites.",
    industriesHeading: "Built around real project requirements.",
    whyHeading: "One partner. Material to site.",
    quoteHeading: "Request a project quote.",
    quoteIntro:
      "Tell us the material, quantity and delivery location. We'll respond with availability, the right vehicle and a project-specific quotation.",
    industriesImageId: null,
  },
  contact: DEFAULT_CONTACT,
  footer: {
    tagline: "From Material Supply to Site Execution.",
    blurb:
      "Construction materials, bulk transportation, earth filling, debris management and site logistics for projects across the Mumbai Metropolitan Region.",
  },
};
