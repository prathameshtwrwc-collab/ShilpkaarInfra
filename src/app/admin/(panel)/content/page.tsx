import { db } from "@/lib/db";
import { getSettings } from "@/lib/content";
import { ContentEditor } from "@/components/admin/ContentEditor";

export default async function AdminContent() {
  const [settings, industries, why] = await Promise.all([
    getSettings(),
    db.industry.findMany({ orderBy: { order: "asc" } }),
    db.differentiator.findMany({ orderBy: { order: "asc" } }),
  ]);
  const ids = [
    settings.hero.imageId,
    settings.hero.mobileImageId,
    settings.hero.videoId,
    settings.about.imageId,
    settings.about.secondaryImageId,
    settings.sections.industriesImageId,
  ].filter(Boolean) as string[];
  const media = await db.media.findMany({ where: { id: { in: ids } }, select: { id: true, url: true, kind: true } });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="display text-5xl md:text-6xl">Page content</h1>
      <p className="mt-2 text-sm text-ink/70">Edit the copy and imagery used across the public website.</p>
      <div className="mt-8">
        <ContentEditor
          settings={settings}
          previews={Object.fromEntries(media.map((m) => [m.id, { url: m.url, kind: m.kind }]))}
          industries={industries.map((i) => ({ title: i.name, body: i.note }))}
          why={why.map((w) => ({ title: w.title, body: w.body }))}
        />
      </div>
    </div>
  );
}
