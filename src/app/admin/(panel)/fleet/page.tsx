import { db } from "@/lib/db";
import { FleetEditor } from "@/components/admin/EntityEditors";

export default async function AdminFleet() {
  const fleet = await db.fleetVehicle.findMany({ orderBy: { order: "asc" }, include: { image: { select: { url: true, kind: true } } } });
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="display text-5xl md:text-6xl">Fleet</h1>
      <p className="mt-2 text-sm text-ink/70">
        Vehicles without a photograph show a labelled line drawing on the website until an authentic photo is added.
      </p>
      <div className="mt-8">
        <FleetEditor
          vehicles={fleet.map((v) => ({
            id: v.id,
            name: v.name,
            vehicleClass: v.vehicleClass,
            role: v.role,
            description: v.description,
            imageId: v.imageId,
            published: v.published,
            preview: v.image,
          }))}
        />
      </div>
    </div>
  );
}
