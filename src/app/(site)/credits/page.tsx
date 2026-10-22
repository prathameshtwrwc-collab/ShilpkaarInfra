import type { Metadata } from "next";
import Image from "next/image";
import { PageIntro } from "@/components/site/PageIntro";
import { db } from "@/lib/db";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Image Credits",
  robots: { index: false },
};

export default async function CreditsPage() {
  const media = await db.media.findMany({
    where: { credit: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true, alt: true, credit: true, license: true, licenseUrl: true, sourceUrl: true, kind: true },
  });
  return (
    <>
      <PageIntro index="—" label="Credits" title="Image credits.">
        Photographs marked “Representative image” illustrate the material or vehicle class and are used under the licences listed below. They are not
        photographs of SHILPKAR&rsquo;s own stock or vehicles.
      </PageIntro>
      <section className="gutter bg-paper py-16">
        <ul className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {media.map((m) => (
            <li key={m.id} className="flex gap-4 border-t border-ink/12 pt-4">
              {m.kind === "IMAGE" && (
                <div className="relative h-16 w-20 shrink-0 overflow-hidden bg-paper-3">
                  <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0 text-sm">
                <p className="font-medium">{m.alt || "Image"}</p>
                <p className="mt-1 text-ink/65">
                  Photo: {m.credit}
                  {m.license && (
                    <>
                      {" · "}
                      {m.licenseUrl ? (
                        <a href={m.licenseUrl} className="underline underline-offset-2" target="_blank" rel="noopener noreferrer license">
                          {m.license}
                        </a>
                      ) : (
                        m.license
                      )}
                    </>
                  )}
                </p>
                {m.sourceUrl && (
                  <a href={m.sourceUrl} className="label mt-1 inline-block text-accent-deep underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
                    Source
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
