"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LiveSitesManager, {
  type LiveSiteProjectItem,
} from "./live-sites-manager";

interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
  pinned: boolean;
}

interface ProjectItem extends LiveSiteProjectItem {
  pinned: boolean;
}

export default function PostList({
  posts,
  projects,
}: {
  posts: Post[];
  projects: ProjectItem[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingPost, setTogglingPost] = useState<string | null>(null);
  const [togglingProject, setTogglingProject] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);

  async function handleDelete(slug: string) {
    if (!confirm(`Delete "${slug}"?`)) return;
    setDeleting(slug);

    const res = await fetch(`/api/admin/posts/${slug}/`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete");
    }
    setDeleting(null);
  }

  async function handleTogglePostPin(slug: string, currentlyPinned: boolean) {
    setTogglingPost(slug);
    const res = await fetch(`/api/admin/posts/${slug}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !currentlyPinned }),
    });
    if (res.ok) {
      router.refresh();
    }
    setTogglingPost(null);
  }

  async function handleToggleProjectPin(
    slug: string,
    currentlyPinned: boolean,
  ) {
    setTogglingProject(slug);
    const res = await fetch("/api/admin/projects/pin/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, pinned: !currentlyPinned }),
    });
    if (res.ok) {
      router.refresh();
    }
    setTogglingProject(null);
  }

  async function handleToggleProjectDelete(
    slug: string,
    name: string,
    currentlyDeleted: boolean,
  ) {
    if (
      !currentlyDeleted &&
      !confirm(
        `Hide "${name}" from the projects page? You can restore it here anytime.`,
      )
    ) {
      return;
    }
    setDeletingProject(slug);
    const res = await fetch("/api/admin/projects/delete/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, deleted: !currentlyDeleted }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to update project");
    }
    setDeletingProject(null);
  }

  async function handleLogout() {
    await fetch("/api/admin/auth/", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="headline text-[30px]">Admin</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-faint hover:text-accent"
        >
          Sign out
        </button>
      </div>

      {/* Quick links */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/admin/r2-photos"
          className="border border-rule px-4 py-2 text-sm font-medium hover:bg-wash"
        >
          Upload Photos
        </Link>
        <Link
          href="/apps"
          className="border border-rule px-4 py-2 text-sm font-medium hover:bg-wash"
        >
          iOS Apps
        </Link>
      </div>

      {/* Posts */}
      <h2 className="text-sm font-medium text-faint uppercase tracking-wider mb-3">
        Posts
      </h2>
      <div className="space-y-3 mb-10">
        {posts.map((post) => (
          <div
            key={post.slug}
            className="flex items-center justify-between border border-rule bg-paper p-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {post.pinned && (
                  <span className="h-1.5 w-1.5 rounded-full bg-ink shrink-0" />
                )}
                <Link
                  href={`/blog/${post.slug}`}
                  className="font-medium text-ink hover:underline"
                >
                  {post.title}
                </Link>
              </div>
              <p className="text-xs text-faint mt-0.5">{post.date}</p>
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <button
                onClick={() => handleTogglePostPin(post.slug, post.pinned)}
                disabled={togglingPost === post.slug}
                className={`border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  post.pinned
                    ? "border-ink bg-ink text-paper hover:opacity-90"
                    : "border-rule text-faint hover:border-accent hover:text-accent"
                }`}
              >
                {togglingPost === post.slug
                  ? "..."
                  : post.pinned
                    ? "Pinned"
                    : "Pin"}
              </button>
              <Link
                href={`/admin/edit/${post.slug}`}
                className="border border-rule px-3 py-1.5 text-xs font-medium text-muted hover:bg-wash"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(post.slug)}
                disabled={deleting === post.slug}
                className="border border-accent px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent hover:text-paper disabled:opacity-50"
              >
                {deleting === post.slug ? "..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-center text-faint py-6">No posts yet.</p>
        )}
      </div>

      <LiveSitesManager projects={projects} />

      {/* Projects */}
      <h2 className="text-sm font-medium text-faint uppercase tracking-wider mb-3">
        Projects
      </h2>
      <div className="space-y-3">
        {projects.map((project) => (
          <div
            key={project.slug}
            className={`flex items-center justify-between border border-rule bg-paper p-4 ${
              project.deleted ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {project.pinned && !project.deleted && (
                <span className="h-1.5 w-1.5 rounded-full bg-ink shrink-0" />
              )}
              <span className="text-lg">{project.emoji}</span>
              <Link
                href={`/projects/${project.slug}`}
                className={`font-medium hover:underline ${
                  project.deleted
                    ? "text-faint line-through"
                    : "text-ink"
                }`}
              >
                {project.name}
              </Link>
              {project.deleted && (
                <span className="shrink-0 bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-paper">
                  Hidden
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              {!project.deleted && (
                <button
                  onClick={() =>
                    handleToggleProjectPin(project.slug, project.pinned)
                  }
                  disabled={togglingProject === project.slug}
                  className={`border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    project.pinned
                      ? "border-ink bg-ink text-paper hover:opacity-90"
                      : "border-rule text-faint hover:border-accent hover:text-accent"
                  }`}
                >
                  {togglingProject === project.slug
                    ? "..."
                    : project.pinned
                      ? "Pinned"
                      : "Pin"}
                </button>
              )}
              <button
                onClick={() =>
                  handleToggleProjectDelete(
                    project.slug,
                    project.name,
                    project.deleted,
                  )
                }
                disabled={deletingProject === project.slug}
                className={`border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  project.deleted
                    ? "border-rule text-muted hover:bg-wash"
                    : "border-accent text-accent hover:bg-accent hover:text-paper"
                }`}
              >
                {deletingProject === project.slug
                  ? "..."
                  : project.deleted
                    ? "Restore"
                    : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
