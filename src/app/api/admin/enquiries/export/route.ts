import Papa from "papaparse";
import { getAdmin, logActivity } from "@/lib/auth";
import { db } from "@/lib/db";
import { enquiryWhere } from "@/lib/enquiry-filters";

export const runtime = "nodejs";

/** Neutralise spreadsheet formula injection (=, +, -, @ at cell start). */
const safe = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
};

export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) return new Response("Unauthorized", { status: 401 });

  const params = new URL(req.url).searchParams;
  const rows = await db.enquiry.findMany({ where: enquiryWhere(params), orderBy: { createdAt: "desc" }, take: 10000 });
  const csv = Papa.unparse(
    rows.map((e) => ({
      Reference: safe(e.reference),
      Received: e.createdAt.toISOString(),
      Status: e.status,
      Company: safe(e.companyName),
      Contact: safe(e.contactPerson),
      Mobile: safe(e.mobile),
      Email: safe(e.email),
      Material: safe(e.materialName),
      Quantity: e.quantity,
      Unit: e.unit,
      "Delivery location": safe(e.deliveryLocation),
      "Delivery date": e.deliveryDate ? e.deliveryDate.toISOString().slice(0, 10) : "",
      GST: e.gst === "GST_INVOICE" ? "GST invoice required" : "No GST invoice needed",
      Requirements: safe(e.requirements),
      Source: safe(e.source),
    })),
  );
  await logActivity(admin.email, "export", "enquiry", `Exported ${rows.length} enquiries`);
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shilpkar-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
