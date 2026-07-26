import type { CopyKey, FrontPageConfig } from "@/lib/front-page";
import { copyFor } from "@/lib/front-page";

/**
 * Renders one editable string. The text is a plain React child — never
 * dangerouslySetInnerHTML — so an override can only ever be visible text.
 * The data-copy attribute is what the editor overlay hooks onto.
 */
export default function Copy({
  k,
  config,
  as: Tag = "span",
  className,
}: {
  k: CopyKey;
  config: FrontPageConfig;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag data-copy={k} className={className}>
      {copyFor(k, config)}
    </Tag>
  );
}
