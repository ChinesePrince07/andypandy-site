import type { Metadata } from "next";
import Link from "next/link";
import { selectVisibleLiveSites } from "@/lib/live-sites";
import { getLiveSitesConfig, getProjectsWithPins } from "@/lib/projects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  const [projects, liveSitesConfig] = await Promise.all([
    getProjectsWithPins(),
    getLiveSitesConfig(),
  ]);
  const liveProjects = selectVisibleLiveSites(projects, liveSitesConfig);

  return (
    <div className="space-y-10">
      <div className="animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Projects
        </h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Explore the sites I&apos;ve built, or browse the full project archive.
        </p>
      </div>

      <section aria-labelledby="live-sites-heading" className="animate-fade-in">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2
              id="live-sites-heading"
              className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100"
            >
              Live sites
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Open a project and try it for yourself.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            {liveProjects.length} sites
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {liveProjects.map((project) => (
            <a
              key={project.slug}
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-w-0 items-center gap-3 rounded-xl border border-gray-200/80 bg-white p-4 transition-colors hover:border-gray-300 hover:bg-gray-50/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-800/80 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:bg-gray-800/70"
              aria-label={`Visit ${project.name} (opens in a new tab)`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg dark:bg-gray-800">
                {project.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-gray-900 dark:text-gray-100">
                  {project.name}
                </span>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                  {new URL(project.demo!).hostname}
                </span>
              </span>
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5H19.5V10.5M19 5L10 14M19.5 14.25V18A1.5 1.5 0 0118 19.5H6A1.5 1.5 0 014.5 18V6A1.5 1.5 0 016 4.5H9.75"
                />
              </svg>
            </a>
          ))}
        </div>
      </section>

      <section aria-labelledby="project-archive-heading">
        <h2
          id="project-archive-heading"
          className="mb-4 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100"
        >
          Project archive
        </h2>
        <div className="stagger space-y-4">
          {projects.map((project) => (
            <Link
              key={project.name}
              href={`/projects/${project.slug}`}
              className="card-hover group block rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800/80 dark:bg-gray-900"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-lg transition-transform group-hover:scale-110 dark:bg-gray-800">
                  {project.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {project.pinned && (
                      <span className="pinned-badge shrink-0">
                        <svg
                          className="h-2.5 w-2.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9"
                          />
                        </svg>
                        Pinned
                      </span>
                    )}
                    <h3 className="font-semibold text-gray-900 transition-colors group-hover:gradient-text dark:text-gray-100">
                      {project.name}
                    </h3>
                    <svg
                      className="h-3.5 w-3.5 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {project.description}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
