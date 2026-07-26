import { notFound } from "next/navigation";
import Link from "next/link";
import { getAboutData, educationSlug } from "@/lib/about";
import { isAdmin } from "@/lib/admin-auth";
import OrgMark from "@/components/org-mark";
import EducationUploader from "@/components/education-uploader";

export const dynamic = "force-dynamic";

const SCHOOL_LOGOS: Record<string, string> = {
  "UC Berkeley": "/logos/berkeley.svg",
  "Suffield Academy": "/logos/suffield.png",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const about = await getAboutData();
  const entry = about.education.find((e) => educationSlug(e.school) === slug);
  if (!entry) return {};
  return {
    title: entry.school,
    description: `${entry.year} · ${entry.location}`,
  };
}

export default async function EducationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [about, admin] = await Promise.all([getAboutData(), isAdmin()]);
  const entry = about.education.find((e) => educationSlug(e.school) === slug);
  if (!entry) notFound();

  const media = entry.media ?? [];

  return (
    <article>
      <header className="border-b border-rule px-4 py-8 sm:px-11 sm:py-12">
        <Link
          href="/"
          className="mono text-[10px] uppercase tracking-[0.16em] text-faint transition-colors hover:text-accent"
        >
          &larr; The front page
        </Link>

        <div data-reveal className="mt-8 flex items-center gap-4">
          <OrgMark
            name={entry.school}
            src={SCHOOL_LOGOS[entry.school] ?? entry.logo}
            size={52}
          />
          <div className="min-w-0">
            <div className="kicker">Schooling</div>
            <h1
              className="headline mt-1"
              style={{ fontSize: "clamp(30px, 4.6vw, 52px)", lineHeight: 1.04 }}
            >
              {entry.school}
            </h1>
          </div>
        </div>
        <p
          data-reveal
          className="mono mt-4 text-[10px] uppercase tracking-[0.14em] text-faint"
        >
          {entry.year} &middot; {entry.location}
        </p>
      </header>

      <div className="px-4 py-10 sm:px-11">
        {entry.body?.length ? (
          <div className="prose max-w-[760px]">
            {entry.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="max-w-[760px] italic text-muted">
            Nothing written up yet.
          </p>
        )}

        {media.length > 0 && (
          <div className="mt-10 max-w-[900px]">
            <div className="kicker">Plates</div>
            <div data-rule className="rule-bar mt-2" />
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {media.map((m) => (
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

        {admin && (
          <div className="max-w-[900px]">
            <EducationUploader about={about} slug={slug} />
          </div>
        )}
      </div>
    </article>
  );
}
