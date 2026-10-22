"use client";

import { useActionState, useEffect, useId, useRef, useState, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { submitEnquiry, type EnquiryState } from "@/app/actions/enquiry";
import { enquirySchema, GST_OPTIONS, OTHER_MATERIAL, UNITS, type EnquiryFieldErrors } from "@/lib/validation";
import { whatsappHref } from "@/lib/contact";
import { QUOTE_EVENT, type QuoteEventDetail } from "./QuoteLink";
import { ArrowRight, WhatsAppIcon } from "./icons";

type Material = { slug: string; name: string; category: string };

const EMPTY = {
  companyName: "",
  contactPerson: "",
  mobile: "",
  email: "",
  material: "",
  quantity: "",
  unit: UNITS[0] as string,
  deliveryLocation: "",
  deliveryDate: "",
  gst: "NO_GST",
  requirements: "",
  source: "",
};
type Values = typeof EMPTY;

type Props = { materials: Material[]; whatsapp: string; defaultMaterial?: string };

export function QuoteForm(props: Props) {
  const [round, setRound] = useState(0);
  return <QuoteFormInner key={round} {...props} onReset={() => setRound((r) => r + 1)} />;
}

function QuoteFormInner({ materials, whatsapp, defaultMaterial, onReset }: Props & { onReset: () => void }) {
  const params = useSearchParams();
  const uid = useId();
  const [values, setValues] = useState<Values>(() => ({ ...EMPTY, material: defaultMaterial ?? "" }));
  const [clientErrors, setClientErrors] = useState<EnquiryFieldErrors>({});
  const [highlight, setHighlight] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const known = new Set(materials.map((m) => m.slug));
  const applySelection = (d: QuoteEventDetail) => {
    setValues((v) => ({
      ...v,
      material: d.material && known.has(d.material) ? d.material : v.material,
      requirements: d.note && !v.requirements.includes(d.note) ? (v.requirements ? `${d.note}\n${v.requirements}` : d.note) : v.requirements,
      source: d.source ?? v.source,
    }));
    setHighlight(true);
    setTimeout(() => setHighlight(false), 1600);
  };

  // Preselect from the URL (/contact?material=…&note=…) and from in-page quote links.
  useEffect(() => {
    setStartedAt(Date.now());
    const material = params.get("material") ?? undefined;
    const note = params.get("note") ?? undefined;
    const source = params.get("source") ?? undefined;
    if (material || note) applySelection({ material, note, source });
    const onQuote = (e: Event) => applySelection((e as CustomEvent<QuoteEventDetail>).detail);
    window.addEventListener(QUOTE_EVENT, onQuote);
    return () => window.removeEventListener(QUOTE_EVENT, onQuote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state]);

  const serverErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const errors: EnquiryFieldErrors = { ...serverErrors, ...clientErrors };

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (clientErrors[k as keyof EnquiryFieldErrors]) setClientErrors((ce) => ({ ...ce, [k]: undefined }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = enquirySchema.safeParse(values);
    const errs: EnquiryFieldErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof EnquiryFieldErrors;
        if (k && !errs[k]) errs[k] = issue.message;
      }
    }
    if (values.material === OTHER_MATERIAL && !values.requirements.trim()) errs.requirements = "Describe the material you need.";
    setClientErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  const grouped = materials.reduce<Record<string, Material[]>>((acc, m) => ((acc[m.category] ??= []).push(m), acc), {});

  if (state.status === "success") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="border border-ink/15 bg-paper p-8 outline-none md:p-12">
        <p className="label text-ok">Quote request received</p>
        <p className="display mt-5 text-5xl md:text-7xl">Thank you.</p>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/75">
          Your request for <strong className="font-semibold text-ink">{state.material}</strong> has been saved. We&rsquo;ll respond on the number you provided.
        </p>
        <dl className="mt-8 inline-grid grid-cols-[auto_auto] items-baseline gap-x-6 border-y border-ink/15 py-4">
          <dt className="label text-ink/65">Reference</dt>
          <dd className="font-mono text-2xl tracking-wider">{state.reference}</dd>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={whatsappHref(whatsapp, `Hello SHILPKAR, following up on quote request ${state.reference} (${state.material}).`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ink gap-3"
          >
            <WhatsAppIcon size={16} /> Follow up on WhatsApp
          </a>
          <button
            type="button"
            className="btn btn-ghost-light"
            onClick={onReset}
          >
            New request
          </button>
        </div>
      </div>
    );
  }

  const field = (name: keyof EnquiryFieldErrors) => ({
    id: `${uid}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${uid}-${name}-err` : undefined,
  });
  const Err = ({ name }: { name: keyof EnquiryFieldErrors }) =>
    errors[name] ? (
      <p id={`${uid}-${name}-err`} className="mt-1.5 text-sm text-danger">
        {errors[name]}
      </p>
    ) : null;
  const Label = ({ name, children, optional }: { name: string; children: React.ReactNode; optional?: boolean }) => (
    <label htmlFor={`${uid}-${name}`} className="label block text-ink/70">
      {children} {optional ? <span className="normal-case tracking-normal text-ink/65">(optional)</span> : <span className="text-accent-deep" aria-hidden="true">*</span>}
    </label>
  );

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative" aria-describedby={`${uid}-privacy`}>
      {state.status === "error" && (
        <div ref={statusRef} tabIndex={-1} role="alert" className="mb-8 border-l-2 border-danger bg-danger/5 px-4 py-3 text-sm text-danger outline-none">
          {state.message}
        </div>
      )}

      {/* Spam traps */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="source" value={values.source} />

      <div className="grid gap-x-8 gap-y-7 md:grid-cols-2">
        <div>
          <Label name="companyName">Company name</Label>
          <input {...field("companyName")} className="field" autoComplete="organization" value={values.companyName} onChange={set("companyName")} required />
          <Err name="companyName" />
        </div>
        <div>
          <Label name="contactPerson">Contact person</Label>
          <input {...field("contactPerson")} className="field" autoComplete="name" value={values.contactPerson} onChange={set("contactPerson")} required />
          <Err name="contactPerson" />
        </div>
        <div>
          <Label name="mobile">Mobile number</Label>
          <div className="flex items-baseline gap-2">
            <span className="text-ink/65">+91</span>
            <input
              {...field("mobile")}
              className="field"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              value={values.mobile}
              onChange={set("mobile")}
              required
            />
          </div>
          <Err name="mobile" />
        </div>
        <div>
          <Label name="email" optional>
            Email
          </Label>
          <input {...field("email")} className="field" type="email" autoComplete="email" value={values.email} onChange={set("email")} />
          <Err name="email" />
        </div>

        <div className={clsx("transition-colors duration-700 md:col-span-2", highlight && "bg-accent-soft/60")}>
          <div className="grid gap-x-8 gap-y-7 md:grid-cols-[1fr_minmax(0,0.75fr)]">
            <div>
              <Label name="material">Material</Label>
              <select {...field("material")} className="field" value={values.material} onChange={set("material")} required>
                <option value="" disabled>
                  Select a material
                </option>
                {Object.entries(grouped).map(([cat, list]) => (
                  <optgroup key={cat} label={cat}>
                    {list.map((m) => (
                      <option key={m.slug} value={m.slug}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <optgroup label="Other">
                  <option value={OTHER_MATERIAL}>Other / project-specific material</option>
                </optgroup>
              </select>
              <Err name="material" />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div>
                <Label name="quantity">Quantity</Label>
                <input
                  {...field("quantity")}
                  className="field"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={values.quantity}
                  onChange={set("quantity")}
                  required
                />
                <Err name="quantity" />
              </div>
              <div>
                <Label name="unit">Unit</Label>
                <select {...field("unit")} className="field" value={values.unit} onChange={set("unit")} required>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <Err name="unit" />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <Label name="deliveryLocation">Delivery location</Label>
          <input
            {...field("deliveryLocation")}
            className="field"
            autoComplete="street-address"
            placeholder="Site address or area, e.g. Thane West"
            value={values.deliveryLocation}
            onChange={set("deliveryLocation")}
            required
          />
          <Err name="deliveryLocation" />
        </div>

        <div>
          <Label name="deliveryDate" optional>
            Required delivery date
          </Label>
          <input
            {...field("deliveryDate")}
            className="field"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={values.deliveryDate}
            onChange={set("deliveryDate")}
          />
          <Err name="deliveryDate" />
        </div>

        <fieldset aria-describedby={errors.gst ? `${uid}-gst-err` : undefined}>
          <legend className="label text-ink/70">
            GST requirement <span className="text-accent-deep" aria-hidden="true">*</span>
          </legend>
          <div className="mt-3 grid gap-2">
            {GST_OPTIONS.map((o) => (
              <label key={o.value} className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem]">
                <input type="radio" name="gst" value={o.value} checked={values.gst === o.value} onChange={set("gst")} className="h-4 w-4 accent-[var(--color-accent-deep)]" />
                {o.label}
              </label>
            ))}
          </div>
          {errors.gst && (
            <p id={`${uid}-gst-err`} className="mt-1.5 text-sm text-danger">
              {errors.gst}
            </p>
          )}
        </fieldset>

        <div className="md:col-span-2">
          <Label name="requirements" optional={values.material !== OTHER_MATERIAL}>
            Additional requirements
          </Label>
          <textarea
            {...field("requirements")}
            className="field min-h-28 resize-y"
            rows={3}
            placeholder="Grade, site access, preferred vehicle, delivery timing…"
            value={values.requirements}
            onChange={set("requirements")}
          />
          <Err name="requirements" />
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p id={`${uid}-privacy`} className="text-sm text-ink/70">
          Your details are used only to respond to this enquiry.
        </p>
        <button type="submit" disabled={pending} className="btn btn-primary min-h-14 w-full text-sm disabled:cursor-wait disabled:opacity-70 sm:w-auto">
          {pending ? "Submitting…" : "Submit Quote Request"} <ArrowRight />
        </button>
      </div>
    </form>
  );
}
