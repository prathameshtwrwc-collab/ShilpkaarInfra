import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { telHref, whatsappHref } from "@/lib/contact";
import { EnquiryControls } from "@/components/admin/EnquiryControls";
import { StatusBadge } from "@/components/admin/ui";

const fmt = (d: Date) => d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function EnquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await db.enquiry.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } }, product: { select: { slug: true, published: true } } },
  });
  if (!e) notFound();

  const rows: [string, React.ReactNode][] = [
    ["Company", e.companyName],
    ["Contact person", e.contactPerson],
    [
      "Mobile",
      <span key="m" className="flex flex-wrap gap-3">
        <a href={telHref(`+91${e.mobile}`)} className="text-accent-deep underline">
          +91 {e.mobile}
        </a>
        <a href={whatsappHref(`91${e.mobile}`, `Hello ${e.contactPerson}, this is SHILPKAR TRANSIT INFRA regarding your quote request ${e.reference}.`)} target="_blank" rel="noopener noreferrer" className="text-accent-deep underline">
          WhatsApp
        </a>
      </span>,
    ],
    ["Email", e.email ? <a key="e" href={`mailto:${e.email}`} className="text-accent-deep underline">{e.email}</a> : "—"],
    [
      "Material",
      e.product ? (
        <Link key="p" href={`/products/${e.product.slug}`} target="_blank" className="underline">
          {e.materialName}
        </Link>
      ) : (
        `${e.materialName}${e.productId === null && e.materialName !== "Other / project-specific material" ? " (product since removed)" : ""}`
      ),
    ],
    ["Quantity", `${e.quantity} ${e.unit}`],
    ["Delivery location", e.deliveryLocation],
    ["Required delivery date", e.deliveryDate ? e.deliveryDate.toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"],
    ["GST", e.gst === "GST_INVOICE" ? "GST invoice required" : "No GST invoice needed"],
    ["Additional requirements", e.requirements ? <span key="r" className="whitespace-pre-wrap">{e.requirements}</span> : "—"],
    ["Started from", e.source ?? "—"],
    ["Email notification", e.notifyStatus.toLowerCase()],
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/enquiries" className="text-sm text-ink/70 hover:text-ink">
        ← All enquiries
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <h1 className="display text-4xl md:text-5xl">{e.companyName}</h1>
        <StatusBadge status={e.status} />
      </div>
      <p className="mt-2 font-mono text-sm text-ink/70">
        {e.reference} · received {fmt(e.createdAt)}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="border border-ink/10 bg-white">
          <h2 className="display-wide border-b border-ink/10 px-5 py-3.5 text-xs">Request details</h2>
          <dl className="divide-y divide-ink/10">
            {rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 px-5 py-3 sm:grid-cols-[11rem_1fr]">
                <dt className="label pt-0.5 text-ink/65">{k}</dt>
                <dd className="text-[0.9375rem]">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <EnquiryControls
          id={e.id}
          status={e.status}
          notes={e.notes.map((n) => ({ id: n.id, body: n.body, author: n.author?.name ?? "Removed user", at: fmt(n.createdAt) }))}
        />
      </div>
    </div>
  );
}
