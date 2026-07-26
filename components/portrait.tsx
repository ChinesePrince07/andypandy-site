import { existsSync } from "node:fs";
import path from "node:path";
import Copy from "@/components/copy";
import type { FrontPageConfig } from "@/lib/front-page";

// ponytail: existence check instead of a config flag — drop a photo at
// public/portrait.jpg and the plate picks it up, no code change.
const PORTRAIT = "/portrait.jpg";
const hasPhoto = existsSync(path.join(process.cwd(), "public", "portrait.jpg"));

/**
 * Fig. 1 — halftone author plate. Two offset impressions of the same
 * image plus an accent pass, so it misregisters like cheap colour print.
 */
export default function Portrait({
  size = 250,
  config,
}: {
  size?: number;
  config: FrontPageConfig;
}) {
  return (
    <aside data-reveal className="shrink-0" style={{ width: size, marginTop: 4 }}>
      <div
        data-tilt
        className="relative overflow-hidden bg-paper"
        style={{ width: size, height: size, willChange: "rotate, translate" }}
      >
        {hasPhoto ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PORTRAIT}
              alt="Andy Zhang"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: "var(--portrait-filter)" }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              data-plate
              src={PORTRAIT}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                filter: "grayscale(1) contrast(1.22) brightness(1.08)",
                mixBlendMode: "screen",
                opacity: 0.4,
                willChange: "translate",
              }}
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0 flex items-center justify-center border border-rule">
              <span className="headline text-ink" style={{ fontSize: size * 0.42 }}>
                AZ
              </span>
            </div>
            <span
              data-plate
              aria-hidden="true"
              className="headline absolute inset-0 flex items-center justify-center text-accent"
              style={{
                fontSize: size * 0.42,
                opacity: 0.5,
                willChange: "translate",
              }}
            >
              AZ
            </span>
          </>
        )}
        {/* The accent pass is a photo treatment — over the monogram it just
            floods the plate, so the fallback goes without it. */}
        {hasPhoto && (
          <div
            className="pointer-events-none absolute inset-0 bg-accent"
            style={{
              mixBlendMode: "var(--plate-blend)" as never,
              opacity: "var(--plate-opacity)" as never,
            }}
          />
        )}
      </div>
      <div className="mono mt-[9px] flex items-baseline justify-between gap-2.5 border-t border-rule pt-2 text-[9.5px] uppercase tracking-[0.14em]">
        <Copy k="portrait.caption" config={config} className="text-muted" />
        <span className="text-faint">Fig. 1</span>
      </div>
    </aside>
  );
}
