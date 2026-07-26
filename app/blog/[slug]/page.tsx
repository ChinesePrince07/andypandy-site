import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/blog";
import { isAdmin } from "@/lib/admin-auth";
import Comments from "@/components/comments";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

function dateline(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const day = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const hasTime = raw.includes("T") || raw.includes(":");
  if (!hasTime) return day;
  return `${day} at ${d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const admin = await isAdmin();

  const plainText = post.content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.round(wordCount / 230));

  return (
    <article>
      <header className="border-b border-rule px-4 py-8 sm:px-11 sm:py-12">
        <div className="mono flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.16em]">
          <Link
            href="/blog"
            className="text-faint transition-colors hover:text-accent"
          >
            &larr; The notebook
          </Link>
          {admin && (
            <Link
              href={`/admin/edit/${slug}`}
              className="text-faint transition-colors hover:text-accent"
            >
              Edit
            </Link>
          )}
        </div>

        <div data-reveal className="kicker mt-8">
          Dispatch
        </div>
        <h1
          data-reveal
          className="headline mt-2.5 max-w-[900px]"
          style={{ fontSize: "clamp(34px, 5.4vw, 64px)", lineHeight: 1.02 }}
        >
          {post.title}
        </h1>
        <p
          data-reveal
          className="mono mt-4 text-[10px] uppercase tracking-[0.14em] text-faint"
        >
          <time dateTime={post.date}>{dateline(post.date)}</time>
          {" · "}
          {wordCount.toLocaleString()} words · {readTime} min read
        </p>
        {post.description && (
          <p
            data-reveal
            className="mt-4 max-w-[700px] text-lg italic leading-relaxed text-muted"
          >
            {post.description}
          </p>
        )}
      </header>

      <div className="px-4 py-10 sm:px-11">
        <div
          className="prose max-w-[760px]"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <div className="max-w-[760px]">
          <Comments slug={slug} isAdmin={admin} />
        </div>
      </div>
    </article>
  );
}
