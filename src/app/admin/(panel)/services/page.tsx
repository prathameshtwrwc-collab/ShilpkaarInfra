import { db } from "@/lib/db";
import { ServiceEditor } from "@/components/admin/EntityEditors";

export default async function AdminServices() {
  const services = await db.service.findMany({ orderBy: { order: "asc" }, include: { image: { select: { url: true, kind: true } } } });
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="display text-5xl md:text-6xl">Services</h1>
      <p className="mt-2 text-sm text-ink/70">Shown in the services sequence on the homepage and /services, in this order.</p>
      <div className="mt-8">
        <ServiceEditor
          services={services.map((s) => ({
            id: s.id,
            title: s.title,
            summary: s.summary,
            detail: s.detail,
            imageId: s.imageId,
            published: s.published,
            preview: s.image,
          }))}
        />
      </div>
    </div>
  );
}
