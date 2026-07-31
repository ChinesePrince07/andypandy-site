import { notFound } from "next/navigation";
import Link from "next/link";
import { experience } from "@/lib/experience";
import { getExperienceEntries, getExperienceEntry } from "@/lib/experience-store";
import { isAdmin } from "@/lib/admin-auth";
import DetailEditor from "@/components/detail-editor";
import OrgMark from "@/components/org-mark";

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
        <div data-reveal className="mt-2.5 flex items-center gap-3.5 sm:gap-5">
          <OrgMark name={e.org} src={e.logo} size={48} />
          <h1
            className="headline max-w-[900px]"
            style={{ fontSize: "clamp(34px, 5.4vw, 64px)", lineHeight: 1.02 }}
          >
            {e.role}
          </h1>
        </div>
        <p
          data-reveal
          className="mono mt-4 text-[10px] uppercase tracking-[0.14em] text-faint"
        >
          {e.when}
          {e.location ? ` · ${e.location}` : ""}
        </p>
      </header>

      <div className="px-4 py-10 sm:px-11">
        {e.media.length > 0 ? (
          <div className="max-w-[1100px] space-y-12 sm:space-y-16">
            {e.body.map((paragraph, idx) => {
              const m = e.media[idx];
              const bgClass = `sticky-bg-${idx % 4}`;
              const tiltClass = `sticky-tilt-${idx % 4}`;

              return (
                <div
                  key={idx}
                  className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center lg:gap-12"
                >
                  <div className="prose text-body text-base sm:text-lg leading-relaxed max-w-none">
                    <p className="mb-0">{paragraph}</p>
                  </div>

                  {m && (
                    <div className="flex justify-center lg:justify-end my-4 lg:my-0">
                      <div
                        className={`sticky-note-card ${bgClass} ${tiltClass} w-full max-w-[320px]`}
                      >
                        {m.type === "video" ? (
                          <video
                            src={m.src}
                            controls
                            playsInline
                            className="h-[200px] w-full border border-rule object-cover"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.src}
                            alt={m.caption ?? ""}
                            loading="lazy"
                            className="h-[200px] w-full border border-rule object-cover"
                          />
                        )}
                        {m.caption && (
                          <div className="mono mt-2.5 text-center text-[9.5px] uppercase tracking-[0.14em] text-faint">
                            {m.caption}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {e.media.length > e.body.length && (
              <div className="mt-12 max-w-[900px]">
                <div className="kicker">Additional Plates</div>
                <div data-rule className="rule-bar mt-2" />
                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  {e.media.slice(e.body.length).map((m) => (
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
        ) : (
          <div className="prose max-w-[760px]">
            {e.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}

        {admin && (
          <div className="mt-12 max-w-[900px]">
            <DetailEditor
              kind="experience"
              slug={slug}
              doc={all}
              body={e.body}
              media={e.media}
            />
          </div>
        )}
      </div>
    </article>
  );
}
