import { notFound } from "next/navigation";
import Link from "next/link";
import { projects } from "@/lib/projects";

export const dynamic = "force-dynamic";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;

async function getReadmeHtml(repo: string): Promise<string | null> {
  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    "User-Agent": "personal-site",
  };

  // Get default branch
  const repoRes = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { ...headers, Accept: "application/vnd.github.v3+json" },
    next: { revalidate: 86400 },
  });
  const branch = repoRes.ok ? (await repoRes.json()).default_branch : "main";

  // Get rendered HTML directly from GitHub API
  const res = await fetch(`https://api.github.com/repos/${repo}/readme`, {
    headers: { ...headers, Accept: "application/vnd.github.v3.html" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  let html = await res.text();

  // Remove GitHub heading anchor links (octicon SVG permalink icons)
  html = html.replace(/<a[^>]*class="anchor"[^>]*>[\s\S]*?<\/a>/g, "");

  // Unwrap markdown-heading divs (GitHub wraps headings in <div class="markdown-heading">)
  html = html.replace(/<div[^>]*class="markdown-heading"[^>]*>\s*/g, "");
  html = html.replace(/\s*<\/div>\s*(?=<h[1-6]|$)/g, "");

  // Remove outer GitHub wrapper elements
  html = html.replace(/<article[^>]*class="markdown-body[^"]*"[^>]*>/g, "");
  html = html.replace(/<\/article>/g, "");
  html = html.replace(/<div[^>]*id="readme"[^>]*>/g, "");

  // Unwrap images from link wrappers (GitHub wraps <img> in <a> pointing to the file)
  html = html.replace(
    /<a[^>]*href="[^"]*"[^>]*>\s*(<img[^>]*>)\s*<\/a>/g,
    "$1"
  );

  // Rewrite relative image src to raw GitHub URLs (handle ./ and / prefixes)
  html = html.replace(
    /src="(?!https?:\/\/)(?:\.\/)?\/?([^"]+)"/g,
    `src="https://raw.githubusercontent.com/${repo}/${branch}/$1"`
  );

  return html;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return { title: project.name };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  const htmlContent = await getReadmeHtml(project.repo);

  return (
    <div>
      <header className="border-b border-rule px-4 py-8 sm:px-11 sm:py-12">
        <Link
          href="/projects"
          className="mono text-[10px] uppercase tracking-[0.16em] text-faint transition-colors hover:text-accent"
        >
          &larr; The directory
        </Link>

        <div data-reveal className="kicker mt-8">
          {project.tags.join(" · ")}
        </div>
        <h1
          data-reveal
          className="headline mt-2.5 flex items-baseline gap-4"
          style={{ fontSize: "clamp(34px, 5.4vw, 64px)", lineHeight: 1.02 }}
        >
          <span aria-hidden="true">{project.emoji}</span>
          {project.name}
        </h1>
        <p data-reveal className="mt-3 max-w-[700px] text-lg italic text-muted">
          {project.description}
        </p>

        <div
          data-reveal
          className="mono mt-5 flex flex-wrap items-center gap-6 text-[10px] uppercase tracking-[0.16em]"
        >
          <a
            href={`https://github.com/${project.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-accent pb-px text-accent"
          >
            Source &#8599;
          </a>
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-accent pb-px text-accent"
            >
              Live demo &#8599;
            </a>
          )}
        </div>
      </header>

      <div className="px-4 py-10 sm:px-11">
        {htmlContent ? (
          <div
            className="prose max-w-[760px]"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <p className="italic text-muted">No README found for this project.</p>
        )}
      </div>
    </div>
  );
}
