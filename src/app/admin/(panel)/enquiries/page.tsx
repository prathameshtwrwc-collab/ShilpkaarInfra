import Link from "next/link";
import { db } from "@/lib/db";
import { enquiryWhere } from "@/lib/enquiry-filters";
import { ENQUIRY_STATUSES } from "@/lib/validation";
import { StatusBadge, inputCls } from "@/components/admin/ui";

const PAGE = 25;
const fmt = (d: Date) => d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const params = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
  const page = Math.max(1, Number(sp.page) || 1);
  const where = enquiryWhere(params);
  const [rows, total, materials] = await Promise.all([
    db.enquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
    db.enquiry.count({ where }),
    db.enquiry.findMany({ distinct: ["materialName"], select: { materialName: true }, orderBy: { materialName: "asc" } }),
  ]);
  const exportParams = new URLSearchParams(params);
  exportParams.delete("page");
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const pageHref = (p: number) => {
    const q = new URLSearchParams(params);
    q.set("page", String(p));
    return `/admin/enquiries?${q}`;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-5xl md:text-6xl">Enquiries</h1>
        <a href={`/api/admin/enquiries/export?${exportParams}`} className="inline-flex min-h-10 items-center bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink-3">
          Export CSV ({total})
        </a>
      </div>

      <form method="get" className="mt-6 grid gap-3 border border-ink/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_auto]">
        <label>
          <span className="label mb-1 block text-ink/65">Search</span>
          <input name="q" defaultValue={sp.q} placeholder="Company, contact, mobile, ref…" className={inputCls} />
        </label>
        <label>
          <span className="label mb-1 block text-ink/65">Status</span>
          <select name="status" defaultValue={sp.status ?? ""} className={inputCls}>
            <option value="">All</option>
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label mb-1 block text-ink/65">Material</span>
          <select name="material" defaultValue={sp.material ?? ""} className={inputCls}>
            <option value="">All</option>
            {materials.map((m) => (
              <option key={m.materialName}>{m.materialName}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label mb-1 block text-ink/65">From</span>
          <input type="date" name="from" defaultValue={sp.from} className={inputCls} />
        </label>
        <label>
          <span className="label mb-1 block text-ink/65">To</span>
          <input type="date" name="to" defaultValue={sp.to} className={inputCls} />
        </label>
        <div className="flex items-end gap-2">
          <button className="min-h-[2.75rem] bg-accent px-4 text-sm font-semibold">Filter</button>
          <Link href="/admin/enquiries" className="inline-flex min-h-[2.75rem] items-center px-2 text-sm text-ink/70 hover:text-ink">
            Reset
          </Link>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto border border-ink/10 bg-white">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="label border-b border-ink/10 text-ink/65">
            <tr>
              <th className="px-4 py-3 font-normal">Received</th>
              <th className="px-4 py-3 font-normal">Company / contact</th>
              <th className="px-4 py-3 font-normal">Material</th>
              <th className="px-4 py-3 font-normal">Quantity</th>
              <th className="px-4 py-3 font-normal">Location</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink/65">
                  No enquiries match these filters.
                </td>
              </tr>
            ) : (
              rows.map((e) => (
                <tr key={e.id} className="hover:bg-paper">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/admin/enquiries/${e.id}`} className="font-mono text-xs text-accent-deep hover:underline">
                      {e.reference}
                    </Link>
                    <span className="block text-xs text-ink/65">{fmt(e.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/enquiries/${e.id}`} className="font-medium hover:underline">
                      {e.companyName}
                    </Link>
                    <span className="block text-xs text-ink/70">
                      {e.contactPerson} · {e.mobile}
                    </span>
                  </td>
                  <td className="px-4 py-3">{e.materialName}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {e.quantity} {e.unit}
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-3">{e.deliveryLocation}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink/70">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="border border-ink/20 bg-white px-3 py-2 hover:border-ink">
                ← Previous
              </Link>
            )}
            {page < pages && (
              <Link href={pageHref(page + 1)} className="border border-ink/20 bg-white px-3 py-2 hover:border-ink">
                Next →
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
