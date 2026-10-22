import "server-only";
import type { Enquiry } from "@prisma/client";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Sends a notification for a saved enquiry. Called only after the enquiry is
 * persisted; failure is recorded on the enquiry and never loses the lead.
 */
export async function notifyEnquiry(e: Enquiry): Promise<"SENT" | "FAILED" | "DISABLED"> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM;
  const to = process.env.NOTIFY_TO;
  if (!key || !from || !to) return "DISABLED";

  const rows: [string, string][] = [
    ["Reference", e.reference],
    ["Company", e.companyName],
    ["Contact", e.contactPerson],
    ["Mobile", e.mobile],
    ["Email", e.email ?? "—"],
    ["Material", e.materialName],
    ["Quantity", `${e.quantity} ${e.unit}`],
    ["Delivery location", e.deliveryLocation],
    ["Delivery date", e.deliveryDate ? e.deliveryDate.toISOString().slice(0, 10) : "—"],
    ["GST", e.gst === "GST_INVOICE" ? "GST invoice required" : "No GST invoice needed"],
    ["Requirements", e.requirements ?? "—"],
  ];
  const html = `<h2>New quote request ${esc(e.reference)}</h2><table cellpadding="6">${rows
    .map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`)
    .join("")}</table>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: to.split(",").map((s) => s.trim()),
        subject: `Quote request ${e.reference} — ${e.materialName}, ${e.quantity} ${e.unit}`,
        html,
        reply_to: e.email ?? undefined,
      }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? "SENT" : "FAILED";
  } catch {
    return "FAILED";
  }
}
