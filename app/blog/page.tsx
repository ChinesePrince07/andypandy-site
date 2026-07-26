import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
};

function longDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div>
      <section className="border-b border-rule px-4 py-10 sm:px-11 sm:py-[68px]">
        <div data-reveal className="kicker">
          The blog
        </div>
        <h1
          data-reveal
          data-parallax="0.04"
          className="headline mt-2.5 max-w-[820px]"
          style={{ fontSize: "clamp(40px, 6vw, 74px)" }}
        >
          Thoughts, tutorials, and updates
        </h1>
        <p data-reveal className="label mt-3 text-[10.5px]">
          {posts.length} {posts.length === 1 ? "dispatch" : "dispatches"}{" "}
          &middot;{" "}
          <Link href="/feed.xml" className="text-accent">
            RSS at /feed.xml
          </Link>
        </p>
      </section>

      {posts.length === 0 ? (
        <p className="px-4 py-16 text-center italic text-muted sm:px-11">
          No dispatches filed yet. Check back soon.
        </p>
      ) : (
        posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            data-reveal
            className="grid gap-2 border-b border-hairline px-4 py-7 transition-colors hover:bg-wash sm:grid-cols-[158px_1fr] sm:gap-6 sm:px-11 sm:py-9"
          >
            <div className="mono text-[10.5px] uppercase leading-relaxed tracking-[0.12em] text-faint">
              {longDate(post.date)}
              {post.pinned && (
                <>
                  <br />
                  <span className="text-accent">Pinned</span>
                </>
              )}
            </div>
            <div>
              <h2
                className="headline"
                style={{
                  fontSize: "clamp(26px, 4vw, 40px)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.018em",
                }}
              >
                {post.title}
              </h2>
              {post.description && (
                <p className="mt-2 max-w-[620px] text-[15px] leading-relaxed text-body-soft sm:text-base">
                  {post.description}
                </p>
              )}
              <span className="mono mt-2 inline-block border-b border-accent pb-px text-[10px] uppercase tracking-[0.16em] text-accent">
                Read the dispatch
              </span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
