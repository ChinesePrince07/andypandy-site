/**
 * A school or employer mark, printed like newsprint: greyscale on the light
 * skin, knocked out on the dark one, so a page full of corporate colours
 * still reads as one paper.
 *
 * Falls back to a monogram when there is no logo file — Portland State has
 * no academic seal on Commons and BioSur is too small to be there at all.
 */
export default function OrgMark({
  name,
  src,
  size = 36,
}: {
  name: string;
  src?: string;
  size?: number;
}) {
  const initials = name
    .replace(/^(The|University of)\s+/i, "")
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (!src && size < 18) return null;

  return (
    <span
      className="flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="max-h-full max-w-full object-contain"
          style={{
            mixBlendMode: "var(--logo-blend)" as never,
            filter: "var(--logo-filter)",
          }}
        />
      ) : (
        <span
          className="mono flex h-full w-full items-center justify-center border border-hairline text-faint"
          style={{ fontSize: size * 0.3, letterSpacing: "0.04em" }}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
