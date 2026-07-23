"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  moveVisibleLiveSite,
  setLiveSiteHidden,
} from "@/lib/live-sites";

export interface LiveSiteProjectItem {
  slug: string;
  name: string;
  emoji: string;
  deleted: boolean;
  demo?: string;
  liveSiteOrder?: number;
  liveSiteHidden: boolean;
}

function orderedLiveSites(
  projects: LiveSiteProjectItem[],
): LiveSiteProjectItem[] {
  return projects
    .filter((project) => project.demo && !project.deleted)
    .sort(
      (a, b) =>
        (a.liveSiteOrder ?? Number.MAX_SAFE_INTEGER) -
        (b.liveSiteOrder ?? Number.MAX_SAFE_INTEGER),
    );
}

export default function LiveSitesManager({
  projects,
}: {
  projects: LiveSiteProjectItem[];
}) {
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [liveSites, setLiveSites] = useState(() => orderedLiveSites(projects));

  useEffect(() => {
    setLiveSites(orderedLiveSites(projects));
  }, [projects]);

  async function saveLiveSites(
    next: LiveSiteProjectItem[],
    activeSlug: string,
  ) {
    setSavingSlug(activeSlug);
    const res = await fetch("/api/admin/projects/live-sites/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: next.map((project) => project.slug),
        hidden: next
          .filter((project) => project.liveSiteHidden)
          .map((project) => project.slug),
      }),
    });

    if (res.ok) {
      setLiveSites(next);
    } else {
      alert("Failed to update live sites");
    }
    setSavingSlug(null);
  }

  async function handleMove(slug: string, direction: -1 | 1) {
    const next = moveVisibleLiveSite(liveSites, slug, direction);
    if (next === liveSites) return;
    await saveLiveSites(next, slug);
  }

  async function handleVisibility(
    slug: string,
    name: string,
    currentlyHidden: boolean,
  ) {
    if (
      !currentlyHidden &&
      !confirm(
        `Remove "${name}" from the Live Sites directory? The project will remain in the archive.`,
      )
    ) {
      return;
    }

    await saveLiveSites(
      setLiveSiteHidden(liveSites, slug, !currentlyHidden),
      slug,
    );
  }

  const visibleSites = liveSites.filter((project) => !project.liveSiteHidden);
  const hiddenSites = liveSites.filter((project) => project.liveSiteHidden);

  return (
    <section aria-labelledby="live-sites-admin-heading" className="mb-10">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2
            id="live-sites-admin-heading"
            className="text-sm font-medium uppercase tracking-wider text-gray-400"
          >
            Live sites
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Set the public order or remove a site from the directory.
          </p>
        </div>
        <Link
          href="/projects"
          className="shrink-0 text-xs font-medium text-gray-400 hover:text-gray-600"
        >
          View directory
        </Link>
      </div>

      <div className="space-y-3">
        {visibleSites.map((project, index) => (
          <div
            key={project.slug}
            className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-5 shrink-0 text-center text-xs font-medium tabular-nums text-gray-300">
                {index + 1}
              </span>
              <span className="text-lg">{project.emoji}</span>
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">
                  {project.name}
                </p>
                <p className="truncate text-xs text-gray-400">
                  {new URL(project.demo!).hostname}
                </p>
              </div>
            </div>
            <div className="ml-8 flex shrink-0 items-center gap-2 sm:ml-4">
              <div className="flex overflow-hidden rounded-md border border-gray-200">
                <button
                  type="button"
                  onClick={() => handleMove(project.slug, -1)}
                  disabled={index === 0 || savingSlug !== null}
                  aria-label={`Move ${project.name} up`}
                  className="border-r border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(project.slug, 1)}
                  disabled={
                    index === visibleSites.length - 1 || savingSlug !== null
                  }
                  aria-label={`Move ${project.name} down`}
                  className="px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleVisibility(
                    project.slug,
                    project.name,
                    project.liveSiteHidden,
                  )
                }
                disabled={savingSlug !== null}
                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                {savingSlug === project.slug ? "..." : "Remove"}
              </button>
            </div>
          </div>
        ))}

        {hiddenSites.map((project) => (
          <div
            key={project.slug}
            className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-70"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-lg grayscale">{project.emoji}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-gray-500">
                    {project.name}
                  </p>
                  <span className="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                    Removed
                  </span>
                </div>
                <p className="truncate text-xs text-gray-400">
                  {new URL(project.demo!).hostname}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                handleVisibility(
                  project.slug,
                  project.name,
                  project.liveSiteHidden,
                )
              }
              disabled={savingSlug !== null}
              className="shrink-0 rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
            >
              {savingSlug === project.slug ? "..." : "Restore"}
            </button>
          </div>
        ))}

        {liveSites.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">
            No projects have live sites yet.
          </p>
        )}
      </div>
    </section>
  );
}
