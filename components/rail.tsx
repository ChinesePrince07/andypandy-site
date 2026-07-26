import Link from "next/link";
import { selectVisibleLiveSites } from "@/lib/live-sites";
import { getLiveSitesConfig, getProjectsWithPins } from "@/lib/projects";
import { getFrontPageConfig } from "@/lib/front-page-store";
import { isHidden } from "@/lib/front-page";

/** Standing "Live now" column down the left edge of every page. */
export default async function Rail() {
  const [projects, config, frontPage] = await Promise.all([
    getProjectsWithPins(),
    getLiveSitesConfig(),
    getFrontPageConfig(),
  ]);
  if (isHidden("rail", frontPage)) return null;
  const live = selectVisibleLiveSites(projects, config);
  // Hardware, embedded and iOS work has nothing to open in a tab, so it
  // never appeared in the rail. It still deserves to be on the page.
  const workshop = projects.filter((p) => !p.demo);

  return (
    <aside
      data-block="rail"
      data-rail-hidden={config.hidden.join(",")}
      className="hidden w-[226px] shrink-0 border-r border-rule py-5 lg:block"
    >
      <div className="mono mx-5 mb-3 flex items-baseline justify-between border-b-2 border-ink pb-2 text-[10px] uppercase tracking-[0.2em]">
        <span className="text-accent">Live now</span>
        <span className="tabular-nums text-faint">{live.length}</span>
      </div>

      {live.map((project, i) => (
        <a
          key={project.slug}
          data-rail={project.slug}
          href={project.demo}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-5 flex items-baseline gap-[11px] border-b border-hairline py-2.5 transition-colors hover:text-accent"
        >
          <span className="mono w-[15px] shrink-0 text-[9.5px] tabular-nums text-accent">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15.5px] leading-tight">
              {project.name}
            </span>
            {/* selectVisibleLiveSites only returns entries with a demo. */}
            <span className="mono block truncate text-[9px] tracking-[0.06em] text-faint">
              {new URL(project.demo!).hostname}
            </span>
          </span>
          <span className="text-[11px] text-accent">&#8599;</span>
        </a>
      ))}

      <div className="mono mx-5 mb-2.5 mt-5 flex items-baseline justify-between border-b-2 border-ink pb-2 text-[10px] uppercase tracking-[0.2em]">
        <span className="text-accent">In the workshop</span>
        <span className="tabular-nums text-faint">{workshop.length}</span>
      </div>

      {workshop.map((project, i) => (
        <Link
          key={project.slug}
          href={`/projects/${project.slug}`}
          className="mx-5 flex items-baseline gap-[11px] border-b border-hairline py-1.5 transition-colors hover:text-accent"
        >
          <span className="mono w-[15px] shrink-0 text-[9.5px] tabular-nums text-faint">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1 truncate text-[14px] leading-tight">
            {project.name}
          </span>
          <span className="text-[10px] text-faint">&rarr;</span>
        </Link>
      ))}
    </aside>
  );
}
