"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { saveDifferentiators, saveIndustries, saveSetting } from "@/app/admin/actions/content";
import type { SettingKey, Settings } from "@/lib/settings-schema";
import { MediaField } from "./MediaPicker";
import { Button, Card, Field, inputCls, useActionToast } from "./ui";

type Previews = Record<string, { url: string; kind: string }>;
type Item = { title: string; body: string };

const TABS = [
  ["hero", "Hero"],
  ["about", "About"],
  ["stats", "Indicators"],
  ["catalogue", "Catalogue"],
  ["sections", "Section headings"],
  ["industries", "Industries"],
  ["why", "Why Shilpkar"],
  ["contact", "Contact"],
  ["footer", "Footer"],
] as const;

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

export function ContentEditor({ settings, previews, industries, why }: { settings: Settings; previews: Previews; industries: Item[]; why: Item[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("hero");
  const [s, setS] = useState(settings);
  const [pv, setPv] = useState(previews);
  const [ind, setInd] = useState(industries);
  const [diff, setDiff] = useState(why);
  const [pending, start] = useTransition();
  const done = useActionToast();
  const router = useRouter();

  const up = <K extends SettingKey>(k: K, patch: Partial<Settings[K]>) => setS((x) => ({ ...x, [k]: { ...(x[k] as object), ...patch } as Settings[K] }));
  const save = (k: SettingKey) => start(async () => void (done(await saveSetting(k, s[k])) && router.refresh()));
  const media = (k: SettingKey, field: string, label: string, kind: "IMAGE" | "VIDEO" = "IMAGE") => {
    const id = (s[k] as Record<string, unknown>)[field] as string | null;
    return (
      <MediaField
        label={label}
        kind={kind}
        value={id}
        preview={id ? (pv[id] ?? null) : null}
        onChange={(newId, m) => {
          if (m) setPv((p) => ({ ...p, [m.id]: { url: m.url, kind: m.kind } }));
          up(k, { [field]: newId } as never);
        }}
      />
    );
  };
  const SaveBar = ({ k, onSave }: { k?: SettingKey; onSave?: () => void }) => (
    <div className="mt-6 flex items-center gap-3 border-t border-ink/10 pt-5">
      <Button disabled={pending} onClick={onSave ?? (() => save(k!))}>
        {pending ? "Saving…" : "Save & publish"}
      </Button>
      <span className="text-xs text-ink/65">Changes appear on the public site immediately after saving.</span>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[12rem_1fr]">
      <nav aria-label="Content sections" className="flex gap-1 overflow-x-auto lg:flex-col">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? "true" : undefined}
            className={clsx("min-h-10 shrink-0 px-3 text-left text-sm", tab === id ? "bg-ink text-paper" : "hover:bg-white")}
          >
            {label}
          </button>
        ))}
      </nav>

      <div>
        {tab === "hero" && (
          <Card title="Hero">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Headline lines" hint="One line per row — line breaks are kept exactly.">
                <textarea className={inputCls} rows={5} value={s.hero.headlineLines.join("\n")} onChange={(e) => up("hero", { headlineLines: e.target.value.split("\n") })} />
              </Field>
              <Field label="Accent line (italic, orange)">
                <select className={inputCls} value={s.hero.accentLine} onChange={(e) => up("hero", { accentLine: Number(e.target.value) })}>
                  {s.hero.headlineLines.map((l, i) => (
                    <option key={i} value={i}>
                      Line {i + 1}: {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Supporting sentence" className="md:col-span-2">
                <textarea className={inputCls} rows={2} maxLength={320} value={s.hero.subcopy} onChange={(e) => up("hero", { subcopy: e.target.value })} />
              </Field>
              {media("hero", "imageId", "Background photograph (desktop)")}
              {media("hero", "mobileImageId", "Mobile crop (optional)")}
              <div className="md:col-span-2">
                {media("hero", "videoId", "Background video (optional, MP4/WebM)", "VIDEO")}
                <p className="mt-2 text-xs text-ink/65">
                  Videos play muted and looped on desktop only; the photograph is the poster and the fallback on mobile, slow connections and reduced-motion settings.
                </p>
              </div>
            </div>
            <SaveBar onSave={() => {
              up("hero", { headlineLines: lines(s.hero.headlineLines.join("\n")) });
              start(async () => void (done(await saveSetting("hero", { ...s.hero, headlineLines: lines(s.hero.headlineLines.join("\n")) })) && router.refresh()));
            }} />
          </Card>
        )}

        {tab === "about" && (
          <Card title="About">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Heading" className="md:col-span-2">
                <input className={inputCls} value={s.about.heading} onChange={(e) => up("about", { heading: e.target.value })} />
              </Field>
              <Field label="Introduction" className="md:col-span-2">
                <textarea className={inputCls} rows={4} value={s.about.intro} onChange={(e) => up("about", { intro: e.target.value })} />
              </Field>
              <Field label="Short statements" hint="One per line (max 6)." className="md:col-span-2">
                <textarea className={inputCls} rows={3} value={s.about.statements.join("\n")} onChange={(e) => up("about", { statements: e.target.value.split("\n") })} />
              </Field>
              {media("about", "imageId", "Main photograph")}
              {media("about", "secondaryImageId", "Inset photograph")}
            </div>
            <h3 className="label mt-8 text-ink/70">Working model steps</h3>
            <ListRows
              items={s.about.steps.map((x) => ({ title: x.title, body: x.body }))}
              onChange={(items) => up("about", { steps: items })}
              max={6}
            />
            <SaveBar onSave={() => start(async () => void (done(await saveSetting("about", { ...s.about, statements: lines(s.about.statements.join("\n")) })) && router.refresh()))} />
          </Card>
        )}

        {tab === "stats" && (
          <Card title="Indicators">
            <p className="mb-4 text-sm text-ink/70">Factual listing figures only (e.g. number of listed grades) — not performance claims.</p>
            <ListRows
              items={s.stats.map((x) => ({ title: x.value, body: x.label }))}
              onChange={(items) => setS((x) => ({ ...x, stats: items.map((i) => ({ value: i.title, label: i.body })) }))}
              max={6}
              titleLabel="Value"
              bodyLabel="Label"
            />
            <SaveBar k="stats" />
          </Card>
        )}

        {tab === "catalogue" && (
          <Card title="Catalogue section">
            <div className="grid gap-5">
              <Field label="Heading">
                <input className={inputCls} value={s.catalogue.heading} onChange={(e) => up("catalogue", { heading: e.target.value })} />
              </Field>
              <Field label="Supporting copy">
                <textarea className={inputCls} rows={2} value={s.catalogue.subcopy} onChange={(e) => up("catalogue", { subcopy: e.target.value })} />
              </Field>
              <Field label="Note">
                <input className={inputCls} value={s.catalogue.note} onChange={(e) => up("catalogue", { note: e.target.value })} />
              </Field>
            </div>
            <SaveBar k="catalogue" />
          </Card>
        )}

        {tab === "sections" && (
          <Card title="Section headings">
            <div className="grid gap-5 md:grid-cols-2">
              {(
                [
                  ["servicesHeading", "Services heading"],
                  ["fleetHeading", "Fleet heading"],
                  ["industriesHeading", "Industries heading"],
                  ["whyHeading", "Why Shilpkar heading"],
                  ["quoteHeading", "Quote heading"],
                ] as const
              ).map(([k, label]) => (
                <Field key={k} label={label}>
                  <input className={inputCls} value={s.sections[k]} onChange={(e) => up("sections", { [k]: e.target.value })} />
                </Field>
              ))}
              <Field label="Fleet introduction" className="md:col-span-2">
                <textarea className={inputCls} rows={2} value={s.sections.fleetIntro} onChange={(e) => up("sections", { fleetIntro: e.target.value })} />
              </Field>
              <Field label="Quote introduction" className="md:col-span-2">
                <textarea className={inputCls} rows={2} value={s.sections.quoteIntro} onChange={(e) => up("sections", { quoteIntro: e.target.value })} />
              </Field>
              {media("sections", "industriesImageId", "Industries photograph")}
            </div>
            <SaveBar k="sections" />
          </Card>
        )}

        {tab === "industries" && (
          <Card title="Industries we serve">
            <ListRows items={ind} onChange={setInd} max={24} titleLabel="Industry" bodyLabel="Short note (optional)" />
            <SaveBar onSave={() => start(async () => void (done(await saveIndustries(ind)) && router.refresh()))} />
          </Card>
        )}

        {tab === "why" && (
          <Card title="Why Shilpkar">
            <p className="mb-4 text-sm text-ink/70">Descriptive statements — avoid unverified numbers or guarantees.</p>
            <ListRows items={diff} onChange={setDiff} max={12} titleLabel="Statement" bodyLabel="Description" />
            <SaveBar onSave={() => start(async () => void (done(await saveDifferentiators(diff)) && router.refresh()))} />
          </Card>
        )}

        {tab === "contact" && (
          <Card title="Contact details">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Phone (display)">
                <input className={inputCls} value={s.contact.phoneDisplay} onChange={(e) => up("contact", { phoneDisplay: e.target.value })} />
              </Field>
              <Field label="Phone (dial)" hint="e.g. +919876543210">
                <input className={inputCls} value={s.contact.phoneTel} onChange={(e) => up("contact", { phoneTel: e.target.value })} />
              </Field>
              <Field label="WhatsApp number" hint="International digits only, e.g. 919876543210">
                <input className={inputCls} value={s.contact.whatsapp} onChange={(e) => up("contact", { whatsapp: e.target.value })} />
              </Field>
              <Field label="Email">
                <input className={inputCls} type="email" value={s.contact.email} onChange={(e) => up("contact", { email: e.target.value })} />
              </Field>
              <Field label="Service area" className="md:col-span-2">
                <textarea className={inputCls} rows={2} value={s.contact.serviceArea} onChange={(e) => up("contact", { serviceArea: e.target.value })} />
              </Field>
            </div>
            <SaveBar k="contact" />
          </Card>
        )}

        {tab === "footer" && (
          <Card title="Footer">
            <div className="grid gap-5">
              <Field label="Tagline">
                <input className={inputCls} value={s.footer.tagline} onChange={(e) => up("footer", { tagline: e.target.value })} />
              </Field>
              <Field label="Summary">
                <textarea className={inputCls} rows={3} value={s.footer.blurb} onChange={(e) => up("footer", { blurb: e.target.value })} />
              </Field>
            </div>
            <SaveBar k="footer" />
          </Card>
        )}
      </div>
    </div>
  );
}

function ListRows({
  items,
  onChange,
  max,
  titleLabel = "Title",
  bodyLabel = "Description",
}: {
  items: Item[];
  onChange: (items: Item[]) => void;
  max: number;
  titleLabel?: string;
  bodyLabel?: string;
}) {
  const set = (i: number, p: Partial<Item>) => onChange(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, d: -1 | 1) => {
    const n = [...items];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    onChange(n);
  };
  return (
    <div className="mt-3">
      <ol className="grid gap-3">
        {items.map((it, i) => (
          <li key={i} className="grid items-end gap-3 border-b border-ink/10 pb-3 md:grid-cols-[2rem_1fr_1.6fr_auto]">
            <span className="font-mono text-xs text-ink/65">{String(i + 1).padStart(2, "0")}</span>
            <Field label={titleLabel}>
              <input className={inputCls} value={it.title} onChange={(e) => set(i, { title: e.target.value })} />
            </Field>
            <Field label={bodyLabel}>
              <input className={inputCls} value={it.body} onChange={(e) => set(i, { body: e.target.value })} />
            </Field>
            <div className="flex gap-1">
              <Button variant="ghost" className="px-2" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                ▲
              </Button>
              <Button variant="ghost" className="px-2" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                ▼
              </Button>
              <Button variant="ghost" className="px-2 text-danger" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                ✕
              </Button>
            </div>
          </li>
        ))}
      </ol>
      {items.length < max && (
        <Button variant="ghost" className="mt-3" onClick={() => onChange([...items, { title: "", body: "" }])}>
          + Add row
        </Button>
      )}
    </div>
  );
}
