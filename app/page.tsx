import Link from "next/link";
import TypingRoles from "@/components/typing-roles";
import Portrait from "@/components/portrait";
import AboutEditor from "@/components/about-editor";
import PageEditor from "@/components/page-editor";
import Copy from "@/components/copy";
import OrgMark from "@/components/org-mark";
import { getAboutData, educationSlug } from "@/lib/about";
import { getAllPosts } from "@/lib/blog";
import { selectVisibleLiveSites } from "@/lib/live-sites";
import { getLiveSitesConfig, getProjectsWithPins } from "@/lib/projects";
import { isAdmin } from "@/lib/admin-auth";
import { getFrontPageConfig } from "@/lib/front-page-store";
import { getExperienceEntries } from "@/lib/experience-store";
import {
  GROUPS,
  isHidden,
  orderedGroup,
  type BlockId,
  type FrontPageConfig,
  type GroupId,
} from "@/lib/front-page";

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

// Selected honours, kept short on purpose — the fuller record is the CV.
const HONOURS = [
  { what: "USAMO qualifier — AIME 12/15", year: "2026" },
  { what: "John Locke Essay Competition, shortlisted", year: "2025" },
  { what: "National Merit Semifinalist — perfect PSAT", year: "2025" },
  { what: "First place, NY Golden Classical Music Award", year: "2024" },
  { what: "AAPT Physics Bowl, top 10%", year: "2025" },
];

// GPA by school. Kept here rather than in about.json because that file is
// R2-backed and its stored copy has no gpa field — a default would be
// silently overridden by the saved data.
const SCHOOL_LOGOS: Record<string, string> = {
  "UC Berkeley": "/logos/berkeley.svg",
  "Suffield Academy": "/logos/suffield.png",
};

const CURRENT_SCHOOL = "UC Berkeley";

const GPA: Record<string, string> = {
  "Suffield Academy": "GPA 4.14",
};

// Summer programmes, deliberately quieter than the degrees above them.
const SUMMER_COURSES = [
  {
    school: "University of Chicago",
    detail: "PHIL 20218 — Philosophy of Life and Death",
    grade: "A · 4.0",
    logo: "/logos/uchicago.svg",
  },
  {
    school: "Portland State University",
    detail: "INTL 404 — field research credit",
    grade: "A · 4.0",
    logo: "/logos/psu.svg",
  },
];

function skillLine(
  skills: { category: string; items: string[] }[],
  category: string,
  limit = 5,
): string {
  const group = skills.find((s) => s.category === category);
  return group ? group.items.slice(0, limit).join(", ") : "—";
}

// Admins see every block in a group, in resolved order, with hidden ones
// marked so the overlay can ghost them. orderedGroup (Task 1) already
// filters hidden blocks for visitors, so admin ordering is derived locally
// here rather than adding an admin-aware function to lib/front-page.ts.
function orderedForAdmin(group: GroupId, config: FrontPageConfig): BlockId[] {
  const saved = (config.order[group] ?? []).filter((id) =>
    (GROUPS[group] as readonly BlockId[]).includes(id),
  );
  return [...saved, ...GROUPS[group].filter((id) => !saved.includes(id))];
}

export default async function FrontPage() {
  const [about, posts, projects, liveConfig, admin, frontPage, experience] =
    await Promise.all([
      getAboutData(),
      // The notebook is a section of the front page, not the point of it —
      // if the store is unreachable, print the paper without it.
      getAllPosts().catch(() => []),
      getProjectsWithPins(),
      getLiveSitesConfig(),
      isAdmin(),
      getFrontPageConfig(),
      getExperienceEntries(),
    ]);
  const live = selectVisibleLiveSites(projects, liveConfig);

  // The ledger is derived, not written down twice — it cannot drift from
  // what the directory and the notebook actually contain.
  const spec = [
    { k: "Base", v: "Hong Kong → Berkeley" },
    { k: "Builds", v: `${projects.length} projects, ${live.length} live` },
    {
      k: "Writing",
      v: `${posts.length} ${posts.length === 1 ? "post" : "posts"}, RSS`,
    },
    { k: "Hardware", v: skillLine(about.skills, "Hardware") },
    { k: "Stack", v: skillLine(about.skills, "Languages", 4) },
  ];

  const mainOrder = admin
    ? orderedForAdmin("main", frontPage)
    : orderedGroup("main", frontPage);
  const sidebarOrder = admin
    ? orderedForAdmin("sidebar", frontPage)
    : orderedGroup("sidebar", frontPage);
  const hiddenAttr = (id: BlockId) =>
    isHidden(id, frontPage) ? "1" : undefined;

  const mainBlocks: Record<string, React.ReactNode> = {
    about: (
      <div key="about" data-block="about" data-block-hidden={hiddenAttr("about")}>
        <div data-reveal className="kicker">
          <Copy k="about.kicker" config={frontPage} />
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

        <div data-reveal className="kicker mt-3">
          Selected honours
        </div>
        <div data-rule className="rule-bar mt-1.5" />
        {HONOURS.map((h) => (
          <div
            key={h.what}
            className="flex items-baseline justify-between gap-3 border-b border-hairline py-[3px]"
          >
            <span className="text-[12.5px] leading-snug text-body">
              {h.what}
            </span>
            <span className="mono shrink-0 text-[9px] tabular-nums tracking-[0.12em] text-faint">
              {h.year}
            </span>
          </div>
        ))}
      </div>
    ),
    spec: (
      <div key="spec" data-block="spec" data-block-hidden={hiddenAttr("spec")}>
        <div data-reveal className="kicker">
          <Copy k="spec.kicker" config={frontPage} />
        </div>
        <div data-rule className="rule-bar mt-1.5" />
        {spec.map((row) => (
          <div
            key={row.k}
            className="mono flex items-baseline justify-between gap-3 border-b border-hairline py-1 text-[10px]"
          >
            <span className="shrink-0 uppercase tracking-[0.14em] text-faint">
              {row.k}
            </span>
            <span className="text-right text-ink">{row.v}</span>
          </div>
        ))}
      </div>
    ),
  };

  const sidebarBlocks: Record<string, React.ReactNode> = {
    schooling: (
      <div
        key="schooling"
        data-block="schooling"
        data-block-hidden={hiddenAttr("schooling")}
      >
        <div data-reveal className="kicker">
          <Copy k="schooling.kicker" config={frontPage} />
        </div>
        <div data-rule className="rule-bar mt-1.5" />
        {about.education.map((entry) => (
          <Link
            key={entry.school}
            href={`/education/${educationSlug(entry.school)}`}
            className="flex items-center gap-3 border-b border-hairline py-2 transition-colors hover:text-accent"
          >
            <OrgMark
              name={entry.school}
              src={SCHOOL_LOGOS[entry.school] ?? entry.logo}
              size={36}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="headline truncate text-[17px] leading-tight">
                  {entry.school}
                </span>
                {GPA[entry.school] && (
                  <span className="mono shrink-0 text-[9px] tracking-[0.1em] text-accent">
                    {GPA[entry.school]}
                  </span>
                )}
              </div>
              <div className="mono text-[8.5px] uppercase tracking-[0.14em] text-faint">
                {entry.year} &middot; {entry.location}
              </div>
              {entry.school === CURRENT_SCHOOL && (
                <div className="mono mt-0.5 flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.14em] text-accent">
                  <span className="h-1 w-1 rounded-full bg-accent animate-pulse-dot" />
                  Currently attending
                </div>
              )}
            </div>
          </Link>
        ))}

        <div className="mono mt-2 text-[8px] uppercase tracking-[0.16em] text-faint">
          Summer courses
        </div>
        {SUMMER_COURSES.map((c) => (
          <div
            key={c.school}
            className="flex items-baseline justify-between gap-2 border-b border-hairline py-1"
          >
            <span className="flex min-w-0 items-center gap-2">
              <OrgMark name={c.school} src={c.logo} size={18} />
              <span className="min-w-0">
              <span className="block truncate text-[12px] leading-tight text-body">
                {c.school}
              </span>
              <span className="mono block truncate text-[8px] uppercase tracking-[0.12em] text-faint">
                {c.detail}
              </span>
              </span>
            </span>
            <span className="mono shrink-0 text-[8.5px] tracking-[0.1em] text-faint">
              {c.grade}
            </span>
          </div>
        ))}
      </div>
    ),
    correspondence: (
      <div
        key="correspondence"
        data-block="correspondence"
        data-block-hidden={hiddenAttr("correspondence")}
      >
        <div data-reveal className="kicker">
          <Copy k="correspondence.kicker" config={frontPage} />
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
            className="mono flex items-baseline justify-between gap-2.5 border-b border-hairline py-1 text-[10px] transition-colors hover:text-accent"
          >
            <span className="uppercase tracking-[0.12em]">{link.label}</span>
            <span className="truncate text-faint">{link.handle}</span>
          </a>
        ))}
      </div>
    ),
    pictures: (
      <div
        key="pictures"
        data-block="pictures"
        data-block-hidden={hiddenAttr("pictures")}
      >
        <a
          href="https://pics.andypandy.org"
          target="_blank"
          rel="noopener noreferrer"
          data-reveal
          className="block border border-rule px-3 py-2 transition-colors hover:border-accent"
        >
          <div className="label text-[9px]">
            <Copy k="pictures.kicker" config={frontPage} />
          </div>
          <div className="headline mt-0.5 text-[17px]">
            <Copy k="pictures.title" config={frontPage} />{" "}
            <span className="text-[13px] text-accent">&#8599;</span>
          </div>
        </a>
      </div>
    ),
  };

  return (
    // The front page is meant to be read without scrolling on a laptop:
    // one masthead band, then everything else side by side.
    <div className="lg:flex lg:h-full lg:flex-col">
      {/* ------------------------------ masthead ---------------------------- */}
      {(!isHidden("hero", frontPage) || admin) && (
        <section
          data-block="hero"
          data-block-hidden={hiddenAttr("hero")}
          className="border-b border-rule px-4 py-4 sm:px-11 sm:py-2.5"
        >
          <div className="flex items-start justify-between gap-6 sm:gap-12">
            <div className="min-w-0">
              <div data-reveal className="kicker">
                <Copy k="hero.kicker" config={frontPage} />
              </div>
              <h1
                data-reveal
                data-parallax="0.04"
                className="headline mt-1.5"
                style={{
                  fontSize: "clamp(40px, 5.2vw, 72px)",
                  lineHeight: 0.88,
                  letterSpacing: "-0.04em",
                }}
              >
                <Copy k="hero.title" config={frontPage} />
              </h1>
              <p
                data-reveal
                className="headline mt-1.5 max-w-[640px]"
                style={{
                  fontSize: "clamp(18px, 1.85vw, 22px)",
                  lineHeight: 1.14,
                  letterSpacing: "-0.015em",
                }}
              >
                <Copy k="hero.tagline" config={frontPage} />
              </p>
              <div
                data-reveal
                className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5"
              >
                <span className="mono flex items-center gap-2.5 text-[10px]">
                  <span className="shrink-0 bg-accent px-2 py-0.5 uppercase tracking-[0.14em] text-paper">
                    <Copy k="hero.badge" config={frontPage} />
                  </span>
                  <TypingRoles />
                </span>
                <span className="mono flex items-center gap-[7px] text-[9.5px] uppercase tracking-[0.14em] text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
                  <Copy k="hero.status" config={frontPage} />
                </span>
              </div>
            </div>

            {(!isHidden("portrait", frontPage) || admin) && (
              <div
                data-block="portrait"
                data-block-hidden={hiddenAttr("portrait")}
                className="hidden sm:block"
              >
                <Portrait size={124} config={frontPage} />
              </div>
            )}
            {(!isHidden("portrait", frontPage) || admin) && (
              <div
                data-block="portrait"
                data-block-hidden={hiddenAttr("portrait")}
                className="sm:hidden"
              >
                <Portrait size={92} config={frontPage} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* --------------------------- the three columns ---------------------- */}
      <div className="grid lg:min-h-0 lg:flex-1 lg:grid-cols-[1.25fr_1.1fr_1fr]">
        {/* About + specification */}
        <section className="border-b border-rule px-4 py-4 sm:px-7 sm:py-3.5 lg:border-b-0 lg:border-r">
          {/* Spacing lives between siblings, not baked into a block's own
              first child — otherwise reordering or hiding a block drags its
              margin along with it. */}
          {mainOrder.map((id, i) =>
            i === 0 ? (
              mainBlocks[id]
            ) : (
              <div key={id} className="mt-4">
                {mainBlocks[id]}
              </div>
            ),
          )}
        </section>

        {/* From the notebook */}
        <section
          data-block="notebook"
          data-block-hidden={hiddenAttr("notebook")}
          className="border-b border-rule px-4 py-4 sm:px-7 sm:py-3.5 lg:min-h-0 lg:overflow-hidden lg:border-b-0 lg:border-r"
        >
          {(!isHidden("notebook", frontPage) || admin) && (
            <>
              <div data-reveal className="kicker">
                <Copy k="notebook.kicker" config={frontPage} />
              </div>
              <div data-rule className="rule-bar mt-1.5" />

              <div className="relative mt-1 pl-4">
                {/* the spine */}
                <span className="absolute left-[3px] top-2 bottom-2 w-px bg-rule" />
                {experience.map((e) => (
                  <Link
                    key={e.slug}
                    href={`/experience/${e.slug}`}
                    data-reveal
                    className="relative block border-b border-hairline py-2 transition-colors hover:text-accent"
                  >
                    <span className="absolute -left-4 top-[13px] h-[7px] w-[7px] rounded-full border border-paper bg-accent" />
                    <span className="mono flex items-baseline justify-between gap-3 text-[9px] uppercase tracking-[0.12em] text-faint">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <OrgMark name={e.org} src={e.logo} size={14} />
                        <span className="truncate">{e.org}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">{e.when}</span>
                    </span>
                    <span className="headline mt-0.5 flex items-baseline gap-2 text-[19px] leading-[1.1]">
                      {e.role}
                      <span className="mono shrink-0 text-[9px] text-accent">
                        &rarr;
                      </span>
                    </span>
                    <span className="mt-1 block line-clamp-2 text-[12.5px] leading-snug text-body-soft">
                      {e.note}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Schooling, correspondence, pictures */}
        <section className="px-4 py-4 sm:px-7 sm:py-3.5">
          {sidebarOrder.map((id, i) =>
            i === 0 ? (
              sidebarBlocks[id]
            ) : (
              <div key={id} className="mt-4">
                {sidebarBlocks[id]}
              </div>
            ),
          )}
        </section>
      </div>

      {/* ------- live strip: stands in for the rail when it is hidden ------- */}
      {(!isHidden("livestrip", frontPage) || admin) && (
        <section
          data-block="livestrip"
          data-block-hidden={hiddenAttr("livestrip")}
          className="border-t border-rule py-6 lg:hidden"
        >
          <div
            data-reveal
            className="mono mx-4 flex items-baseline justify-between text-[9px] uppercase tracking-[0.2em]"
          >
            <span className="text-accent">
              <Copy k="livestrip.kicker" config={frontPage} />
            </span>
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
      )}

      {/* Both editors draw only fixed-position chrome, so the admin's copy
          of the page has the same layout as the visitor's. */}
      {admin && (
        <>
          <PageEditor hidden={frontPage.hidden} />
          <AboutEditor data={about} />
        </>
      )}
    </div>
  );
}
