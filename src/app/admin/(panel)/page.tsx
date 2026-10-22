import Link from "next/link";
import { db } from "@/lib/db";
import { ENQUIRY_STATUSES } from "@/lib/validation";
import { StatusBadge } from "@/components/admin/ui";

const fmt = (d: Date) => d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default async function Dashboard() {
  const [recent, byStatus, products, published, fleet, services, media, activity, failedNotify] = await Promise.all([
    db.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.enquiry.groupBy({ by: ["status"], _count: true }),
    db.product.count(),
    db.product.count({ where: { published: true } }),
    db.fleetVehicle.count(),
    db.service.count(),
    db.media.count(),
    db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    db.enquiry.count({ where: { notifyStatus: "FAILED" } }),
  ]);
  const counts = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="display text-5xl md:text-6xl">Dashboard</h1>

      {failedNotify > 0 && (
        <p className="mt-6 border-l-4 border-danger bg-white px-4 py-3 text-sm">
          {failedNotify} enquir{failedNotify === 1 ? "y was" : "ies were"} saved but the email notification failed. They are all listed under Enquiries.
        </p>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-px border border-ink/10 bg-ink/10 md:grid-cols-4">
        {ENQUIRY_STATUSES.map((s) => (
          <Link key={s} href={`/admin/enquiries?status=${s}`} className="flex flex-col-reverse bg-white p-5 hover:bg-paper">
            <dt className="label text-ink/65">{s.toLowerCase()} enquiries</dt>
            <dd className="display text-5xl">{counts[s] ?? 0}</dd>
          </Link>
        ))}
      </dl>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="border border-ink/10 bg-white lg:col-span-2">
          <header className="flex items-center justify-between border-b border-ink/10 px-5 py-3.5">
            <h2 className="display-wide text-xs">Recent quote enquiries</h2>
            <Link href="/admin/enquiries" className="text-sm font-medium text-accent-deep hover:underline">
              All enquiries →
            </Link>
          </header>
          {recent.length === 0 ? (
            <p className="p-5 text-sm text-ink/70">No enquiries yet. Submissions from the website quote form appear here.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {recent.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/enquiries/${e.id}`} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-paper">
                    <span className="truncate font-medium">{e.companyName}</span>
                    <StatusBadge status={e.status} />
                    <span className="truncate text-sm text-ink/70">
                      {e.materialName} · {e.quantity} {e.unit} · {e.deliveryLocation}
                    </span>
                    <span className="font-mono text-xs text-ink/65">{fmt(e.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid content-start gap-6">
          <section className="border border-ink/10 bg-white">
            <h2 className="display-wide border-b border-ink/10 px-5 py-3.5 text-xs">Content</h2>
            <ul className="divide-y divide-ink/10 text-sm">
              {[
                ["/admin/products", "Products", `${published} published / ${products} total`],
                ["/admin/services", "Services", `${services}`],
                ["/admin/fleet", "Fleet", `${fleet} vehicles`],
                ["/admin/media", "Media library", `${media} files`],
                ["/admin/content", "Page content", "Hero, about, contact…"],
              ].map(([href, label, meta]) => (
                <li key={href}>
                  <Link href={href} className="flex items-center justify-between px-5 py-3 hover:bg-paper">
                    <span className="font-medium">{label}</span>
                    <span className="text-ink/65">{meta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-ink/10 bg-white">
            <h2 className="display-wide border-b border-ink/10 px-5 py-3.5 text-xs">Recent changes</h2>
            {activity.length === 0 ? (
              <p className="p-5 text-sm text-ink/70">No changes yet.</p>
            ) : (
              <ul className="divide-y divide-ink/10 text-sm">
                {activity.map((a) => (
                  <li key={a.id} className="px-5 py-2.5">
                    <p className="truncate">{a.summary}</p>
                    <p className="text-xs text-ink/65">
                      {a.actor} · {fmt(a.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
