import type { Metadata } from "next";
import Link from "next/link";
import { getProjectsWithPins } from "@/lib/projects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  const projects = await getProjectsWithPins();

  return (
    <div>
      <section className="border-b border-rule px-4 py-5 sm:px-11 sm:py-6">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            <div data-reveal className="kicker">
              The directory
            </div>
            <h1
              data-reveal
              data-parallax="0.04"
              className="headline mt-1.5"
              style={{ fontSize: "clamp(34px, 4.4vw, 56px)" }}
            >
              Projects
            </h1>
          </div>
          <a
            href="https://github.com/ChinesePrince07"
            target="_blank"
            rel="noopener noreferrer"
            data-reveal
            className="mono shrink-0 border-b border-accent pb-px text-[10px] uppercase tracking-[0.16em] text-accent"
          >
            github.com/ChinesePrince07 &#8599;
          </a>
        </div>
        <p
          data-reveal
          className="mt-2 max-w-[680px] text-[14px] italic text-muted sm:text-[15px]"
        >
          Everything I&rsquo;ve built, live or not. Hardware, embedded and iOS
          builds are catalogued on GitHub.
        </p>
      </section>

      {/* ------------------------------ the archive ------------------------- */}
      <section className="px-4 pb-3 pt-6 sm:px-11">
        <div
          data-reveal
          className="mono flex items-baseline justify-between gap-4 text-[10px] uppercase tracking-[0.2em]"
        >
          <span className="text-accent">The archive</span>
          <span className="text-faint">{projects.length} entries</span>
        </div>
        <div data-rule className="rule-bar mt-3" />
      </section>

      {/* The row is a container, not one big link: the live-site link has to
          sit beside the entry link, and an <a> inside an <a> is invalid. */}
      {projects.map((project) => (
        <div
          key={project.slug}
          data-reveal
          className="grid grid-cols-[1fr_16px] items-start gap-x-4 border-b border-hairline px-4 py-5 transition-colors hover:bg-wash sm:grid-cols-[1fr_200px_24px] sm:px-11"
        >
          <div className="min-w-0">
            <div className="flex items-baseline gap-2.5">
              <h3 className="headline text-[23px] leading-tight">
                <Link
                  href={`/projects/${project.slug}`}
                  className="transition-colors hover:text-accent"
                >
                  {project.name}
                </Link>
              </h3>
              {project.pinned && (
                <span className="mono shrink-0 text-[8.5px] uppercase tracking-[0.14em] text-accent">
                  Pinned
                </span>
              )}
              {/* The rail carries the live URLs; here a marker is enough. */}
              {project.demo && (
                <span className="mono flex shrink-0 items-center gap-1.5 text-[8.5px] uppercase tracking-[0.14em] text-faint">
                  <span className="h-1 w-1 rounded-full bg-accent" />
                  Live
                </span>
              )}
            </div>

            <p className="mt-1 max-w-[620px] text-[14.5px] leading-snug text-body-soft">
              {project.description}
            </p>
            <div className="mono mt-1.5 text-[9px] uppercase tracking-[0.12em] text-faint sm:hidden">
              {project.tags.join(" · ")}
            </div>
          </div>

          <div className="mono hidden pt-1.5 text-[9px] uppercase tracking-[0.12em] text-faint sm:block">
            {project.tags.join(" · ")}
          </div>
          <Link
            href={`/projects/${project.slug}`}
            aria-label={`Open ${project.name}`}
            className="pt-1 text-right text-[15px] text-accent"
          >
            &rarr;
          </Link>
        </div>
      ))}
    </div>
  );
}
