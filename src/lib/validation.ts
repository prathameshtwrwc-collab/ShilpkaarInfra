import { z } from "zod";

export const UNITS = ["Brass"] as const;
export const GST_OPTIONS = [
  { value: "NO_GST", label: "No GST invoice needed" },
  { value: "GST_INVOICE", label: "GST invoice required (share GSTIN when we contact you)" },
] as const;
export const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "QUOTED", "CLOSED"] as const;

/** Matches 10-digit Indian mobiles (6–9 prefix), optionally with +91 / 0. */
export function normaliseIndianMobile(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "").replace(/^\+?91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

const text = (max: number) => z.string().trim().max(max);

export const enquirySchema = z.object({
  companyName: text(120).min(2, "Enter your company name."),
  contactPerson: text(80).min(2, "Enter the contact person's name."),
  mobile: z
    .string()
    .trim()
    .refine((v) => normaliseIndianMobile(v) !== null, "Enter a valid 10-digit Indian mobile number."),
  email: z
    .string()
    .trim()
    .max(160)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address, or leave it blank."),
  material: text(80).min(1, "Select a material."),
  quantity: z.coerce
    .number({ error: "Enter a quantity." })
    .refine((n) => Number.isFinite(n) && n > 0, "Quantity must be greater than zero.")
    .refine((n) => n <= 100000, "Please contact us directly for quantities this large."),
  unit: z.enum(UNITS, { error: "Select a unit." }),
  deliveryLocation: text(200).min(3, "Enter the delivery location."),
  deliveryDate: z
    .string()
    .trim()
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Enter a valid date.")
    .refine((v) => {
      if (v === "") return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(v) >= today;
    }, "Delivery date can't be in the past."),
  gst: z.enum(["NO_GST", "GST_INVOICE"], { error: "Select a GST option." }),
  requirements: text(2000),
  source: text(80).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type EnquiryFieldErrors = Partial<Record<keyof EnquiryInput, string>>;

export const OTHER_MATERIAL = "other";
