"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ScrambleText from "./scramble-text";
import ThemeToggle from "./theme-toggle";
import LiveClock from "./live-clock";

const LINKS = [
  { href: "/", label: "About", short: "About" },
  { href: "/projects", label: "Projects", short: "Apps" },
  { href: "/blog", label: "Blog", short: "Blog" },
  {
    href: "https://pics.andypandy.org",
    label: "Photos ↗",
    short: "Pics ↗",
    external: true,
  },
];

// Every route gets a section name in the dateline, the way a paper labels
// its pages. Anything unlisted is filed under the archive.
function pageLabel(pathname: string): string {
  if (pathname === "/") return "The Front Page";
  if (pathname.startsWith("/projects")) return "The Directory";
  if (pathname.startsWith("/blog")) return "The Blog";
  if (pathname.startsWith("/experience")) return "The Record";
  if (pathname.startsWith("/education")) return "Schooling";
  if (pathname.startsWith("/travels")) return "The Itinerary";
  if (pathname.startsWith("/photos")) return "The Plates";
  if (pathname.startsWith("/admin")) return "The Composing Room";
  return "The Archive";
}

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function Header() {
  const pathname = usePathname();
  const [dateline, setDateline] = useState({ long: "", short: "" });

  // Filled in after mount: the server has no idea what day it is where the
  // reader is, and a mismatch would break hydration.
  useEffect(() => {
    const now = new Date();
    setDateline({
      long: now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      short: now.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    });
  }, []);

  return (
    <header>
      <div className="h-[5px] bg-ink sm:h-[6px]" />

      {/* masthead */}
      <div className="flex h-14 items-center justify-between border-b border-rule px-4 sm:h-16 sm:px-11">
        <Link href="/" className="relative inline-block">
          <span
            data-ghost
            aria-hidden="true"
            className="headline pointer-events-none absolute left-0 top-0 whitespace-nowrap text-accent opacity-50"
            style={{
              fontSize: "clamp(23px, 4vw, 29px)",
              letterSpacing: "-0.005em",
            }}
          >
            ANDY ZHANG
          </span>
          <span
            className="headline relative whitespace-nowrap"
            style={{
              fontSize: "clamp(23px, 4vw, 29px)",
              letterSpacing: "-0.005em",
            }}
          >
            <ScrambleText text="ANDY ZHANG" interval={7000} />
          </span>
        </Link>

        <div className="mono flex items-center gap-[22px] text-[10.5px] uppercase tracking-[0.2em]">
          <nav className="hidden items-center gap-[22px] md:flex">
            {LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pb-0.5 text-muted transition-colors hover:text-accent"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={
                    isCurrent(pathname, link.href) ? "page" : undefined
                  }
                  className={`border-b-[1.5px] pb-0.5 transition-colors ${
                    isCurrent(pathname, link.href)
                      ? "border-accent text-accent"
                      : "border-transparent text-muted hover:text-accent"
                  }`}
                >
                  {link.label}
                </Link>
              ),
            )}
            <span className="h-[13px] w-px bg-rule" />
          </nav>
          <ThemeToggle />
        </div>
      </div>

      {/* tab bar — stands in for the masthead nav on narrow stock */}
      <nav className="mono flex items-stretch border-b border-rule text-[9.5px] uppercase tracking-[0.16em] md:hidden">
        {LINKS.map((link) =>
          link.external ? (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 flex-1 items-center justify-center text-muted"
            >
              {link.short}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
              className={`flex min-h-11 flex-1 items-center justify-center border-r border-hairline ${
                isCurrent(pathname, link.href)
                  ? "bg-wash text-accent"
                  : "text-muted"
              }`}
            >
              {link.short}
            </Link>
          ),
        )}
      </nav>

      {/* dateline + reading progress */}
      <div className="sticky top-0 z-30 bg-paper">
        <div className="label flex h-[30px] items-center justify-between gap-3 border-b border-rule px-4 text-[9px] sm:h-[34px] sm:px-11 sm:text-[10px]">
          <span>{pageLabel(pathname)}</span>
          <span className="truncate">
            {dateline.long ? (
              <>
                <span className="hidden sm:inline">
                  {dateline.long} · Hong Kong
                </span>
                <span className="sm:hidden">Hong Kong · {dateline.short}</span>
              </>
            ) : (
              " "
            )}
          </span>
          <LiveClock />
        </div>
        <div className="h-0.5 bg-hairline">
          <div data-progress className="h-0.5 w-0 bg-accent" />
        </div>
      </div>
    </header>
  );
}
