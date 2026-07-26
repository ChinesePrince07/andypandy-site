import { selectVisibleLiveSites } from "@/lib/live-sites";
import { getLiveSitesConfig, getProjectsWithPins } from "@/lib/projects";

/** Standing "Live now" column down the left edge of every page. */
export default async function Rail() {
  const [projects, config] = await Promise.all([
    getProjectsWithPins(),
    getLiveSitesConfig(),
  ]);
  const live = selectVisibleLiveSites(projects, config);

  return (
    <aside className="hidden w-[226px] shrink-0 border-r border-rule py-[30px] lg:block">
      <div className="mono mx-5 mb-3 flex items-baseline justify-between border-b-2 border-ink pb-2 text-[10px] uppercase tracking-[0.2em]">
        <span className="text-accent">Live now</span>
        <span className="tabular-nums text-faint">{live.length}</span>
      </div>

      {live.map((project, i) => (
        <a
          key={project.slug}
          href={project.demo}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-5 flex items-baseline gap-[11px] border-b border-hairline py-3 transition-colors hover:text-accent"
        >
          <span className="mono w-[15px] shrink-0 text-[9.5px] tabular-nums text-accent">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1 text-[15.5px] leading-tight">
            {project.name}
          </span>
          <span className="text-[11px] text-accent">&#8599;</span>
        </a>
      ))}

      <p className="mx-5 mt-[22px] text-[13px] italic leading-normal text-muted">
        Hardware and iOS builds live on{" "}
        <a
          href="https://github.com/ChinesePrince07"
          target="_blank"
          rel="noopener noreferrer"
          className="mono text-[10.5px] not-italic text-accent"
        >
          GitHub &#8599;
        </a>
      </p>
    </aside>
  );
}
