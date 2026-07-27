import { notFound } from "next/navigation";
import Link from "next/link";
import { experience } from "@/lib/experience";
import { getExperienceEntries, getExperienceEntry } from "@/lib/experience-store";
import { isAdmin } from "@/lib/admin-auth";
import DetailEditor from "@/components/detail-editor";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return experience.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = await getExperienceEntry(slug);
  if (!e) return {};
  return { title: `${e.role} — ${e.org}`, description: e.note };
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [e, all, admin] = await Promise.all([
    getExperienceEntry(slug),
    getExperienceEntries(),
    isAdmin(),
  ]);
  if (!e) notFound();

  return (
    <article>
      <header className="border-b border-rule px-4 py-8 sm:px-11 sm:py-12">
        <Link
          href="/"
          className="mono text-[10px] uppercase tracking-[0.16em] text-faint transition-colors hover:text-accent"
        >
          &larr; The front page
        </Link>

        <div data-reveal className="kicker mt-8">
          {e.org}
        </div>
        <h1
          data-reveal
          className="headline mt-2.5 max-w-[900px]"
          style={{ fontSize: "clamp(34px, 5.4vw, 64px)", lineHeight: 1.02 }}
        >
          {e.role}
        </h1>
        <p
          data-reveal
          className="mono mt-4 text-[10px] uppercase tracking-[0.14em] text-faint"
        >
          {e.when}
          {e.location ? ` · ${e.location}` : ""}
        </p>
      </header>

      <div className="px-4 py-10 sm:px-11">
        <div className="prose max-w-[760px]">
          {e.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {admin && (
          <div className="max-w-[900px]">
            <DetailEditor
              kind="experience"
              slug={slug}
              doc={all}
              body={e.body}
              media={e.media}
            />
          </div>
        )}

        {e.media.length > 0 && (
          <div className="mt-10 max-w-[900px]">
            <div className="kicker">Plates</div>
            <div data-rule className="rule-bar mt-2" />
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {e.media.map((m) => (
                <figure key={m.src}>
                  {m.type === "video" ? (
                    <video
                      src={m.src}
                      controls
                      playsInline
                      className="w-full border border-rule"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.src}
                      alt={m.caption ?? ""}
                      loading="lazy"
                      className="w-full border border-rule"
                    />
                  )}
                  {m.caption && (
                    <figcaption className="mono mt-2 text-[9.5px] uppercase tracking-[0.14em] text-faint">
                      {m.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
