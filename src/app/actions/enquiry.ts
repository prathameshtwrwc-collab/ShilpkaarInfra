"use server";

import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hasDatabase } from "@/lib/mode";
import { notifyEnquiry } from "@/lib/notify";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { enquirySchema, normaliseIndianMobile, OTHER_MATERIAL, type EnquiryFieldErrors } from "@/lib/validation";

export type EnquiryState =
  | { status: "idle" }
  | { status: "success"; reference: string; material: string }
  | { status: "error"; message: string; fieldErrors?: EnquiryFieldErrors };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeReference() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Array.from(randomBytes(5), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `STI-${ymd}-${rand}`;
}

export async function submitEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  if (!hasDatabase) {
    return { status: "error", message: "Online quote requests are launching soon. Please send your details on WhatsApp or call us." };
  }
  // Spam traps: a hidden honeypot field and a minimum fill time.
  const honeypot = String(formData.get("website") ?? "");
  const startedAt = Number(formData.get("startedAt") ?? 0);
  if (honeypot !== "" || (startedAt && Date.now() - startedAt < 2500)) {
    return { status: "error", message: "We couldn't accept this submission. Please try again, or call us directly." };
  }

  const ip = await clientIp();
  const ipHash = hashIp(ip);
  if (!(await rateLimit("enquiry", ipHash, 5, 10 * 60))) {
    return {
      status: "error",
      message: "Too many requests from this connection. Please wait a few minutes, or reach us on WhatsApp or phone.",
    };
  }

  const raw = Object.fromEntries(
    ["companyName", "contactPerson", "mobile", "email", "material", "quantity", "unit", "deliveryLocation", "deliveryDate", "gst", "requirements", "source"].map(
      (k) => [k, String(formData.get(k) ?? "")],
    ),
  );
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: EnquiryFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof EnquiryFieldErrors;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  let productId: string | null = null;
  let materialName: string;
  if (data.material === OTHER_MATERIAL) {
    if (!data.requirements) {
      return {
        status: "error",
        message: "Please check the highlighted fields.",
        fieldErrors: { requirements: "Describe the material you need." },
      };
    }
    materialName = "Other / project-specific material";
  } else {
    const product = await db.product.findFirst({ where: { slug: data.material, published: true }, select: { id: true, name: true } });
    if (!product) {
      return { status: "error", message: "Please check the highlighted fields.", fieldErrors: { material: "Select a material from the list." } };
    }
    productId = product.id;
    materialName = product.name;
  }

  let enquiry;
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        enquiry = await db.enquiry.create({
          data: {
            reference: makeReference(),
            companyName: data.companyName,
            contactPerson: data.contactPerson,
            mobile: normaliseIndianMobile(data.mobile)!,
            email: data.email || null,
            productId,
            materialName,
            quantity: data.quantity,
            unit: data.unit,
            deliveryLocation: data.deliveryLocation,
            deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
            gst: data.gst,
            requirements: data.requirements || null,
            source: data.source || null,
            ipHash,
          },
        });
        break;
      } catch (e) {
        const dup = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
        if (!dup || attempt >= 3) throw e;
      }
    }
  } catch (e) {
    console.error("Enquiry persistence failed", e);
    return {
      status: "error",
      message: "Your request could not be saved due to a server problem. Your details are still in the form — please try again, or contact us on WhatsApp or phone.",
    };
  }

  // Lead is saved. Notification failure is recorded but never discards it.
  const notifyStatus = await notifyEnquiry(enquiry);
  await db.enquiry.update({ where: { id: enquiry.id }, data: { notifyStatus } }).catch(() => {});

  return { status: "success", reference: enquiry.reference, material: materialName };
}
