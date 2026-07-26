import Link from "next/link";
import TypingRoles from "@/components/typing-roles";
import Portrait from "@/components/portrait";
import AboutEditor from "@/components/about-editor";
import { getAboutData } from "@/lib/about";
import { getAllPosts } from "@/lib/blog";
import { selectVisibleLiveSites } from "@/lib/live-sites";
import { getLiveSitesConfig, getProjectsWithPins } from "@/lib/projects";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const LINKS = [
  {
    label: "GitHub",
    handle: "ChinesePrince07",
    href: "https://github.com/ChinesePrince07",
  },
  {
    label: "LinkedIn",
    handle: "andy-zhang",
    href: "https://www.linkedin.com/in/andy-zhang-3a280135a/",
  },
  {
    label: "Instagram",
    handle: "andypandy0527",
    href: "https://www.instagram.com/andypandy0527/",
  },
  {
    label: "Email",
    handle: "zhangandy4321@gmail.com",
    href: "mailto:zhangandy4321@gmail.com",
  },
];

function shortDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
}

function skillLine(
  skills: { category: string; items: string[] }[],
  category: string,
  limit = 5,
): string {
  const group = skills.find((s) => s.category === category);
  return group ? group.items.slice(0, limit).join(", ") : "—";
}

export default async function FrontPage() {
  const [about, posts, projects, liveConfig, admin] = await Promise.all([
    getAboutData(),
    // The notebook is a section of the front page, not the point of it —
    // if the store is unreachable, print the paper without it.
    getAllPosts().catch(() => []),
    getProjectsWithPins(),
    getLiveSitesConfig(),
    isAdmin(),
  ]);
  const live = selectVisibleLiveSites(projects, liveConfig);
  const topPosts = posts.slice(0, 3);

  // The ledger is derived, not written down twice — it cannot drift from
  // what the directory and the notebook actually contain.
  const spec = [
    { k: "Base", v: "Berkeley, California" },
    { k: "Builds", v: `${projects.length} projects, ${live.length} live` },
    {
      k: "Writing",
      v: `${posts.length} ${posts.length === 1 ? "post" : "posts"}, RSS`,
    },
    { k: "Hardware", v: skillLine(about.skills, "Hardware") },
    { k: "Stack", v: skillLine(about.skills, "Languages", 4) },
  ];

  return (
    // The front page is meant to be read without scrolling on a laptop:
    // one masthead band, then everything else side by side.
    <div className="lg:flex lg:h-full lg:flex-col">
      {/* ------------------------------ masthead ---------------------------- */}
      <section className="border-b border-rule px-4 py-5 sm:px-11 sm:py-[14px]">
        <div className="flex items-start justify-between gap-6 sm:gap-12">
          <div className="min-w-0">
            <div data-reveal className="kicker">
              About the author
            </div>
            <h1
              data-reveal
              data-parallax="0.04"
              className="headline mt-1.5"
              style={{
                fontSize: "clamp(48px, 6.4vw, 92px)",
                lineHeight: 0.88,
                letterSpacing: "-0.04em",
              }}
            >
              Andy Zhang
            </h1>
            <p
              data-reveal
              className="headline mt-2 max-w-[640px]"
              style={{
                fontSize: "clamp(19px, 2.1vw, 25px)",
                lineHeight: 1.14,
                letterSpacing: "-0.015em",
              }}
            >
              Developer, tinkerer, and builder of things
            </p>
            <div
              data-reveal
              className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5"
            >
              <span className="mono flex items-center gap-2.5 text-[10px]">
                <span className="shrink-0 bg-accent px-2 py-0.5 uppercase tracking-[0.14em] text-paper">
                  Currently into
                </span>
                <TypingRoles />
              </span>
              <span className="mono flex items-center gap-[7px] text-[9.5px] uppercase tracking-[0.14em] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
                Available for projects
              </span>
            </div>
          </div>

          <div className="hidden sm:block">
            <Portrait size={140} />
          </div>
          <div className="sm:hidden">
            <Portrait size={92} />
          </div>
        </div>
      </section>

      {/* --------------------------- the three columns ---------------------- */}
      <div className="grid lg:min-h-0 lg:flex-1 lg:grid-cols-[1.25fr_1.1fr_1fr]">
        {/* About + specification */}
        <section className="border-b border-rule px-4 py-4 sm:px-7 sm:py-3.5 lg:border-b-0 lg:border-r">
          <div data-reveal className="kicker">
            About
          </div>
          <div data-rule className="rule-bar mt-1.5" />
          <div
            data-reveal
            className="mt-3 flex flex-col gap-2.5 text-[14px] leading-[1.55] text-body"
          >
            {about.bio.map((paragraph, i) => (
              <p key={i} className={i === 0 ? "dropcap overflow-hidden" : ""}>
                {paragraph}
              </p>
            ))}
          </div>

          <div data-reveal className="kicker mt-4">
            Specification
          </div>
          <div data-rule className="rule-bar mt-1.5" />
          {spec.map((row) => (
            <div
              key={row.k}
              className="mono flex items-baseline justify-between gap-3 border-b border-hairline py-1.5 text-[10px]"
            >
              <span className="shrink-0 uppercase tracking-[0.14em] text-faint">
                {row.k}
              </span>
              <span className="text-right text-ink">{row.v}</span>
            </div>
          ))}
        </section>

        {/* From the notebook */}
        <section className="border-b border-rule px-4 py-4 sm:px-7 sm:py-3.5 lg:border-b-0 lg:border-r">
          <div
            data-reveal
            className="mono flex items-baseline justify-between gap-4 text-[10px] uppercase tracking-[0.2em]"
          >
            <span className="text-accent">From the notebook</span>
            <Link href="/blog" className="text-faint hover:text-accent">
              All {posts.length} &rarr;
            </Link>
          </div>
          <div data-rule className="rule-bar mt-1.5" />

          {topPosts.length === 0 ? (
            <p className="mt-4 text-[14px] italic text-muted">
              No dispatches filed yet. Check back soon.
            </p>
          ) : (
            topPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                data-reveal
                className="block border-b border-hairline py-3 transition-colors hover:text-accent"
              >
                <div className="mono text-[9px] tabular-nums tracking-[0.12em] text-faint">
                  {shortDate(post.date)}
                </div>
                <h3 className="headline mt-0.5 text-[21px] leading-[1.1]">
                  {post.title}
                </h3>
                {post.description && (
                  <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-body-soft">
                    {post.description}
                  </p>
                )}
              </Link>
            ))
          )}
        </section>

        {/* Schooling, correspondence, pictures */}
        <section className="px-4 py-4 sm:px-7 sm:py-3.5">
          <div data-reveal className="kicker">
            Schooling
          </div>
          <div data-rule className="rule-bar mt-1.5" />
          {about.education.map((entry) => (
            <div
              key={entry.school}
              className="flex items-center gap-3 border-b border-hairline py-2"
            >
              {entry.logo && (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.logo}
                    alt={entry.school}
                    className="max-h-full max-w-full object-contain"
                    style={{
                      mixBlendMode: "var(--seal-blend)" as never,
                      filter: "var(--seal-filter)",
                    }}
                  />
                </span>
              )}
              <div className="min-w-0">
                <div className="headline text-[17px] leading-tight">
                  {entry.school}
                </div>
                <div className="mono text-[8.5px] uppercase tracking-[0.14em] text-faint">
                  {entry.year} &middot; {entry.location}
                </div>
              </div>
            </div>
          ))}

          <div data-reveal className="kicker mt-4">
            Correspondence
          </div>
          <div data-rule className="rule-bar mt-1.5" />
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={
                link.href.startsWith("http") ? "noopener noreferrer" : undefined
              }
              className="mono flex items-baseline justify-between gap-2.5 border-b border-hairline py-1.5 text-[10px] transition-colors hover:text-accent"
            >
              <span className="uppercase tracking-[0.12em]">{link.label}</span>
              <span className="truncate text-faint">{link.handle}</span>
            </a>
          ))}

          <a
            href="https://pics.andypandy.org"
            target="_blank"
            rel="noopener noreferrer"
            data-reveal
            className="mt-4 block border border-rule px-3 py-2 transition-colors hover:border-accent"
          >
            <div className="label text-[9px]">Pictures</div>
            <div className="headline mt-0.5 text-[17px]">
              pics.andypandy.org{" "}
              <span className="text-[13px] text-accent">&#8599;</span>
            </div>
          </a>
        </section>
      </div>

      {/* ------- live strip: stands in for the rail when it is hidden ------- */}
      <section className="border-t border-rule py-6 lg:hidden">
        <div
          data-reveal
          className="mono mx-4 flex items-baseline justify-between text-[9px] uppercase tracking-[0.2em]"
        >
          <span className="text-accent">Live now</span>
          <span className="text-faint">{live.length} — swipe</span>
        </div>
        <div data-rule className="rule-bar mx-4 mt-2" />
        <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
          {live.map((project, i) => (
            <a
              key={project.slug}
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[118px] w-[188px] shrink-0 snap-start flex-col gap-1.5 border border-rule p-3 active:border-accent active:bg-wash"
            >
              <div className="mono flex items-baseline justify-between text-[9px] tracking-[0.14em] text-accent">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <span className="uppercase text-faint">
                  {project.tags[project.tags.length - 1]}
                </span>
              </div>
              <div className="headline text-[20px] leading-tight">
                {project.name}
              </div>
              <p className="flex-1 text-[12.5px] leading-snug text-body-soft">
                {project.description}
              </p>
              <div className="mono text-[9px] tracking-[0.08em] text-accent">
                Open &#8599;
              </div>
            </a>
          ))}
        </div>
      </section>

      {admin && (
        <div className="border-t border-rule px-4 py-8 sm:px-11">
          <AboutEditor data={about} />
        </div>
      )}
    </div>
  );
}
