# Front-Page Visual Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the logged-in admin hide, reorder, and reword named blocks on the front page directly on the page, with saves going live immediately.

**Architecture:** A single override file in R2 (`content/front-page.json`) records what differs from the code. Pure functions resolve overrides against code defaults; the front page renders through them. A client overlay, mounted only for admins, draws handles on `[data-block]` elements and makes `[data-copy]` elements editable, POSTing one operation at a time to an allowlisted admin route.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, vitest, R2 via `@aws-sdk/client-s3`.

## Global Constraints

- Pure logic lives in a module with **no `next/*` or AWS imports**, so vitest can import it directly. This mirrors `lib/live-sites.ts` (pure) versus `lib/projects.ts` (cached). Violating it breaks the test run.
- Admin API routes authenticate with `isAdminRequest(req)` from `@/lib/admin-auth`, return `Response.json`, and call `revalidateTag`. Copy `app/api/admin/about/route.ts`.
- Override copy is rendered as a React text node. **Never** `dangerouslySetInnerHTML`.
- Copy values: max 500 characters, control characters stripped.
- Unknown block ids and copy keys are rejected server-side against a constant allowlist.
- Any read failure (R2 down, corrupt JSON) resolves to the empty config, so the front page renders exactly what the code says. The editor must never be able to 500 `/`.
- Ship by committing and pushing to `main`; Vercel redeploys. Never `vercel --prod`.

---

### Task 1: Pure config module

**Files:**
- Create: `lib/front-page.ts`
- Test: `lib/front-page.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `BLOCK_IDS`, `GROUPS`, `COPY_DEFAULTS`, `MAX_COPY_LENGTH`, `EMPTY_CONFIG`, types `BlockId`/`GroupId`/`CopyKey`/`FrontPageConfig`/`EditorOp`, and functions `parseConfig(raw: unknown): FrontPageConfig`, `isHidden(id: BlockId, c: FrontPageConfig): boolean`, `orderedGroup(g: GroupId, c: FrontPageConfig): BlockId[]`, `copyFor(k: CopyKey, c: FrontPageConfig): string`, `applyOp(c: FrontPageConfig, op: unknown): FrontPageConfig` (throws `Error` on invalid input).

- [ ] **Step 1: Write the failing test**

Create `lib/front-page.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  applyOp,
  copyFor,
  EMPTY_CONFIG,
  isHidden,
  orderedGroup,
  parseConfig,
  type FrontPageConfig,
} from "./front-page";

describe("parseConfig", () => {
  it("returns the empty config for junk", () => {
    expect(parseConfig(null)).toEqual(EMPTY_CONFIG);
    expect(parseConfig("nope")).toEqual(EMPTY_CONFIG);
    expect(parseConfig({ hidden: "spec" })).toEqual(EMPTY_CONFIG);
  });

  it("drops unknown block ids and copy keys", () => {
    expect(
      parseConfig({
        hidden: ["spec", "not-a-block"],
        order: { sidebar: ["pictures", "bogus"], nope: ["spec"] },
        copy: { "hero.tagline": "hi", "bad.key": "x" },
      }),
    ).toEqual({
      hidden: ["spec"],
      order: { sidebar: ["pictures"] },
      copy: { "hero.tagline": "hi" },
    });
  });
});

describe("isHidden", () => {
  it("is false by default and true once hidden", () => {
    expect(isHidden("spec", EMPTY_CONFIG)).toBe(false);
    expect(isHidden("spec", { ...EMPTY_CONFIG, hidden: ["spec"] })).toBe(true);
  });
});

describe("orderedGroup", () => {
  it("uses code order by default", () => {
    expect(orderedGroup("sidebar", EMPTY_CONFIG)).toEqual([
      "schooling",
      "correspondence",
      "pictures",
    ]);
  });

  it("applies a saved order and appends blocks the config never mentioned", () => {
    const c: FrontPageConfig = {
      ...EMPTY_CONFIG,
      order: { sidebar: ["pictures", "schooling"] },
    };
    expect(orderedGroup("sidebar", c)).toEqual([
      "pictures",
      "schooling",
      "correspondence",
    ]);
  });

  it("omits hidden blocks", () => {
    const c: FrontPageConfig = { ...EMPTY_CONFIG, hidden: ["schooling"] };
    expect(orderedGroup("sidebar", c)).toEqual(["correspondence", "pictures"]);
  });
});

describe("copyFor", () => {
  it("falls back to the code default", () => {
    expect(copyFor("hero.tagline", EMPTY_CONFIG)).toBe(
      "Developer, tinkerer, and builder of things",
    );
  });

  it("returns the override when set", () => {
    const c: FrontPageConfig = {
      ...EMPTY_CONFIG,
      copy: { "hero.tagline": "Builder" },
    };
    expect(copyFor("hero.tagline", c)).toBe("Builder");
  });
});

describe("applyOp", () => {
  it("hides and shows, round-tripping to the original", () => {
    const hidden = applyOp(EMPTY_CONFIG, { op: "hide", block: "spec" });
    expect(hidden.hidden).toEqual(["spec"]);
    expect(applyOp(hidden, { op: "show", block: "spec" })).toEqual(EMPTY_CONFIG);
  });

  it("does not duplicate an already-hidden block", () => {
    const once = applyOp(EMPTY_CONFIG, { op: "hide", block: "spec" });
    expect(applyOp(once, { op: "hide", block: "spec" }).hidden).toEqual(["spec"]);
  });

  it("moves a block within its group", () => {
    const moved = applyOp(EMPTY_CONFIG, { op: "move", block: "pictures", dir: -1 });
    expect(moved.order.sidebar).toEqual([
      "schooling",
      "pictures",
      "correspondence",
    ]);
  });

  it("clamps a move at the ends instead of wrapping", () => {
    const first = applyOp(EMPTY_CONFIG, { op: "move", block: "schooling", dir: -1 });
    expect(orderedGroup("sidebar", first)).toEqual([
      "schooling",
      "correspondence",
      "pictures",
    ]);
    const last = applyOp(EMPTY_CONFIG, { op: "move", block: "pictures", dir: 1 });
    expect(orderedGroup("sidebar", last)).toEqual([
      "schooling",
      "correspondence",
      "pictures",
    ]);
  });

  it("stores copy, capping length", () => {
    const long = applyOp(EMPTY_CONFIG, {
      op: "copy",
      key: "hero.tagline",
      value: "x".repeat(900),
    });
    expect(long.copy["hero.tagline"]!.length).toBe(500);
  });

  it("clears an override when set back to the code default", () => {
    const c = applyOp(EMPTY_CONFIG, {
      op: "copy",
      key: "hero.tagline",
      value: "Developer, tinkerer, and builder of things",
    });
    expect(c.copy["hero.tagline"]).toBeUndefined();
  });

  it("resets everything", () => {
    const dirty = applyOp(
      applyOp(EMPTY_CONFIG, { op: "hide", block: "spec" }),
      { op: "copy", key: "hero.tagline", value: "Builder" },
    );
    expect(applyOp(dirty, { op: "reset" })).toEqual(EMPTY_CONFIG);
  });

  it("rejects unknown blocks, keys, and operations", () => {
    expect(() => applyOp(EMPTY_CONFIG, { op: "hide", block: "nope" })).toThrow();
    expect(() =>
      applyOp(EMPTY_CONFIG, { op: "copy", key: "bad.key", value: "x" }),
    ).toThrow();
    expect(() => applyOp(EMPTY_CONFIG, { op: "explode" })).toThrow();
    expect(() => applyOp(EMPTY_CONFIG, null)).toThrow();
  });

  it("refuses to move a block that has no group", () => {
    expect(() => applyOp(EMPTY_CONFIG, { op: "move", block: "hero", dir: 1 })).toThrow();
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `npm test -- lib/front-page.test.ts`
Expected: FAIL — `Cannot find module './front-page'`.

- [ ] **Step 3: Write the implementation**

Create `lib/front-page.ts`. No `next/*` or AWS imports in this file.

```ts
/**
 * Pure resolution of front-page overrides against the code defaults.
 * Deliberately free of next/* and AWS imports so vitest can import it
 * directly — same split as live-sites.ts (pure) vs projects.ts (cached).
 */

export const BLOCK_IDS = [
  "hero",
  "portrait",
  "about",
  "spec",
  "notebook",
  "schooling",
  "correspondence",
  "pictures",
  "livestrip",
  "rail",
] as const;

export type BlockId = (typeof BLOCK_IDS)[number];

/** Blocks that can be reordered, and the order the code renders them in. */
export const GROUPS = {
  main: ["about", "spec"],
  sidebar: ["schooling", "correspondence", "pictures"],
} as const satisfies Record<string, readonly BlockId[]>;

export type GroupId = keyof typeof GROUPS;

/** Every editable code literal, with the wording the code ships. */
export const COPY_DEFAULTS = {
  "hero.kicker": "About the author",
  "hero.title": "Andy Zhang",
  "hero.tagline": "Developer, tinkerer, and builder of things",
  "hero.badge": "Currently into",
  "hero.status": "Available for projects",
  "portrait.caption": "The author",
  "about.kicker": "About",
  "spec.kicker": "Specification",
  "notebook.kicker": "From the notebook",
  "schooling.kicker": "Schooling",
  "correspondence.kicker": "Correspondence",
  "pictures.kicker": "Pictures",
  "pictures.title": "pics.andypandy.org",
  "pictures.sub": "Albums, EXIF, map — kept on its own host.",
  "livestrip.kicker": "Live now",
} as const;

export type CopyKey = keyof typeof COPY_DEFAULTS;

export const MAX_COPY_LENGTH = 500;

export interface FrontPageConfig {
  hidden: BlockId[];
  order: Partial<Record<GroupId, BlockId[]>>;
  copy: Partial<Record<CopyKey, string>>;
}

export const EMPTY_CONFIG: FrontPageConfig = { hidden: [], order: {}, copy: {} };

export type EditorOp =
  | { op: "hide" | "show"; block: BlockId }
  | { op: "move"; block: BlockId; dir: -1 | 1 }
  | { op: "copy"; key: CopyKey; value: string }
  | { op: "reset" };

function isBlockId(v: unknown): v is BlockId {
  return typeof v === "string" && (BLOCK_IDS as readonly string[]).includes(v);
}

function isGroupId(v: unknown): v is GroupId {
  return typeof v === "string" && Object.hasOwn(GROUPS, v);
}

function isCopyKey(v: unknown): v is CopyKey {
  return typeof v === "string" && Object.hasOwn(COPY_DEFAULTS, v);
}

function groupOf(block: BlockId): GroupId | null {
  for (const g of Object.keys(GROUPS) as GroupId[]) {
    if ((GROUPS[g] as readonly BlockId[]).includes(block)) return g;
  }
  return null;
}

/** Strip control characters and cap length. Copy is text, never markup. */
function cleanCopy(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[ -]/g, "").slice(0, MAX_COPY_LENGTH);
}

/**
 * Tolerant of anything: a hand-edited or half-written file must never throw,
 * because the front page renders through this.
 */
export function parseConfig(raw: unknown): FrontPageConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return EMPTY_CONFIG;
  const src = raw as Record<string, unknown>;

  const hidden = Array.isArray(src.hidden) ? src.hidden.filter(isBlockId) : [];

  const order: FrontPageConfig["order"] = {};
  if (src.order && typeof src.order === "object" && !Array.isArray(src.order)) {
    for (const [g, ids] of Object.entries(src.order)) {
      if (!isGroupId(g) || !Array.isArray(ids)) continue;
      const known = ids.filter(isBlockId).filter((id) => groupOf(id) === g);
      if (known.length) order[g] = known;
    }
  }

  const copy: FrontPageConfig["copy"] = {};
  if (src.copy && typeof src.copy === "object" && !Array.isArray(src.copy)) {
    for (const [k, v] of Object.entries(src.copy)) {
      if (isCopyKey(k) && typeof v === "string") copy[k] = cleanCopy(v);
    }
  }

  return { hidden, order, copy };
}

export function isHidden(id: BlockId, config: FrontPageConfig): boolean {
  return config.hidden.includes(id);
}

/** Saved order first, then any block the config never mentioned, minus hidden. */
export function orderedGroup(
  group: GroupId,
  config: FrontPageConfig,
): BlockId[] {
  const code = GROUPS[group] as readonly BlockId[];
  const saved = (config.order[group] ?? []).filter((id) => code.includes(id));
  const rest = code.filter((id) => !saved.includes(id));
  return [...saved, ...rest].filter((id) => !isHidden(id, config));
}

export function copyFor(key: CopyKey, config: FrontPageConfig): string {
  return config.copy[key] ?? COPY_DEFAULTS[key];
}

/**
 * Validate and apply one operation. Throws on anything unrecognised so the
 * route can answer 400 without a second validation pass.
 */
export function applyOp(config: FrontPageConfig, op: unknown): FrontPageConfig {
  if (!op || typeof op !== "object") throw new Error("Malformed operation");
  const o = op as Record<string, unknown>;

  switch (o.op) {
    case "reset":
      return EMPTY_CONFIG;

    case "hide": {
      if (!isBlockId(o.block)) throw new Error(`Unknown block: ${String(o.block)}`);
      if (config.hidden.includes(o.block)) return config;
      return { ...config, hidden: [...config.hidden, o.block] };
    }

    case "show": {
      if (!isBlockId(o.block)) throw new Error(`Unknown block: ${String(o.block)}`);
      return { ...config, hidden: config.hidden.filter((b) => b !== o.block) };
    }

    case "move": {
      if (!isBlockId(o.block)) throw new Error(`Unknown block: ${String(o.block)}`);
      if (o.dir !== -1 && o.dir !== 1) throw new Error("dir must be -1 or 1");
      const group = groupOf(o.block);
      if (!group) throw new Error(`${o.block} is not reorderable`);

      // Order over the full group, hidden included, so a hidden neighbour
      // does not silently swallow a move.
      const code = GROUPS[group] as readonly BlockId[];
      const saved = (config.order[group] ?? []).filter((id) => code.includes(id));
      const full = [...saved, ...code.filter((id) => !saved.includes(id))];

      const i = full.indexOf(o.block);
      const j = i + o.dir;
      if (j < 0 || j >= full.length) return config; // clamp, do not wrap
      const next = [...full];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...config, order: { ...config.order, [group]: next } };
    }

    case "copy": {
      if (!isCopyKey(o.key)) throw new Error(`Unknown copy key: ${String(o.key)}`);
      if (typeof o.value !== "string") throw new Error("value must be a string");
      const value = cleanCopy(o.value).trim();
      const copy = { ...config.copy };
      // Matching the code default is the same as having no override.
      if (!value || value === COPY_DEFAULTS[o.key]) delete copy[o.key];
      else copy[o.key] = value;
      return { ...config, copy };
    }

    default:
      throw new Error(`Unknown operation: ${String(o.op)}`);
  }
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `npm test -- lib/front-page.test.ts`
Expected: PASS, all cases green.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add lib/front-page.ts lib/front-page.test.ts
git commit -m "feat: pure front-page override resolution"
```

---

### Task 2: R2 store and admin route

**Files:**
- Create: `lib/front-page-store.ts`
- Create: `app/api/admin/front-page/route.ts`

**Interfaces:**
- Consumes: `parseConfig`, `applyOp`, `FrontPageConfig`, `EMPTY_CONFIG` from Task 1; `r2GetText`/`r2Put` from `@/lib/r2-storage`; `isAdminRequest` from `@/lib/admin-auth`.
- Produces: `getFrontPageConfig(): Promise<FrontPageConfig>` and `saveFrontPageConfig(c: FrontPageConfig): Promise<void>`, plus `POST /api/admin/front-page`.

- [ ] **Step 1: Write the store**

Create `lib/front-page-store.ts`, mirroring `lib/about.ts`:

```ts
import { unstable_cache } from "next/cache";
import { r2GetText, r2Put } from "./r2-storage";
import { EMPTY_CONFIG, parseConfig, type FrontPageConfig } from "./front-page";

const FRONT_PAGE_KEY = "content/front-page.json";

const loadFrontPage = unstable_cache(
  async (): Promise<FrontPageConfig> => {
    try {
      const text = await r2GetText(FRONT_PAGE_KEY);
      return text ? parseConfig(JSON.parse(text)) : EMPTY_CONFIG;
    } catch {
      // An unreachable or corrupt store must not take the front page down.
      return EMPTY_CONFIG;
    }
  },
  ["front-page-config"],
  { tags: ["front-page"], revalidate: 60 },
);

export async function getFrontPageConfig(): Promise<FrontPageConfig> {
  return loadFrontPage();
}

export async function saveFrontPageConfig(
  config: FrontPageConfig,
): Promise<void> {
  await r2Put(
    FRONT_PAGE_KEY,
    JSON.stringify(config, null, 2),
    "application/json; charset=utf-8",
  );
}
```

- [ ] **Step 2: Write the route**

Create `app/api/admin/front-page/route.ts`:

```ts
import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminRequest } from "@/lib/admin-auth";
import { applyOp } from "@/lib/front-page";
import { getFrontPageConfig, saveFrontPageConfig } from "@/lib/front-page-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let next;
  try {
    // applyOp validates against the allowlist and throws on anything unknown.
    next = applyOp(await getFrontPageConfig(), await req.json());
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Bad request" },
      { status: 400 },
    );
  }

  await saveFrontPageConfig(next);
  revalidateTag("front-page");
  return Response.json({ ok: true, config: next });
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Verify the route rejects anonymous callers**

Run, with the dev server up:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/admin/front-page/ \
  -H 'Content-Type: application/json' -d '{"op":"hide","block":"spec"}'
```

Expected: `401`.

- [ ] **Step 5: Commit**

```bash
git add lib/front-page-store.ts app/api/admin/front-page/route.ts
git commit -m "feat: front-page override store and admin route"
```

---

### Task 3: Label the front page and honour the config

**Files:**
- Create: `components/copy.tsx`
- Modify: `app/page.tsx`
- Modify: `components/rail.tsx`

**Interfaces:**
- Consumes: `getFrontPageConfig` (Task 2); `copyFor`, `isHidden`, `orderedGroup`, `BlockId`, `CopyKey`, `FrontPageConfig` (Task 1).
- Produces: the DOM contract the overlay depends on — every block wrapper carries `data-block="<BlockId>"`, and every editable string is wrapped in `<Copy>`, which renders `data-copy="<CopyKey>"`.

- [ ] **Step 1: Write the Copy component**

Create `components/copy.tsx`:

```tsx
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
```

- [ ] **Step 2: Wire the config into the front page**

In `app/page.tsx`, add the imports:

```tsx
import { getFrontPageConfig } from "@/lib/front-page-store";
import { isHidden, orderedGroup } from "@/lib/front-page";
import Copy from "@/components/copy";
```

Add `getFrontPageConfig()` to the existing `Promise.all`, destructured as `frontPage`.

Extract each block into a local `const` keyed by id, then render through the resolved order. Sketch for the sidebar column — apply the same shape to `main`:

```tsx
const sidebarBlocks: Record<string, React.ReactNode> = {
  schooling: (
    <div key="schooling" data-block="schooling">
      <Copy k="schooling.kicker" config={frontPage} className="kicker" />
      {/* …existing schooling markup… */}
    </div>
  ),
  correspondence: (/* …existing markup, same wrapper shape… */),
  pictures: (/* …existing markup, same wrapper shape… */),
};

<section className="px-4 py-4 sm:px-7 sm:py-3.5">
  {orderedGroup("sidebar", frontPage).map((id) => sidebarBlocks[id])}
</section>
```

Standalone blocks guard on `isHidden`. Note the `|| admin` — the overlay ghosts hidden blocks, which requires the server to still render them for the admin:

```tsx
{(!isHidden("hero", frontPage) || admin) && (
  <section
    data-block="hero"
    data-block-hidden={isHidden("hero", frontPage) ? "1" : undefined}
    className="border-b border-rule …"
  >
    <Copy k="hero.kicker" config={frontPage} className="kicker" />
    …
    {(!isHidden("portrait", frontPage) || admin) && (
      <div data-block="portrait" className="hidden sm:block">
        <Portrait size={140} />
      </div>
    )}
  </section>
)}
```

Apply the same `|| admin` guard and `data-block-hidden` marker inside `orderedGroup` rendering, by using `GROUPS` order for admins and `orderedGroup` for visitors.

Replace every hardcoded literal listed in `COPY_DEFAULTS` with a `<Copy>` using the matching key. Leave derived text (`13 projects, 8 live`, post dates, counts) exactly as it is.

- [ ] **Step 3: Make the rail respect its toggle**

In `components/rail.tsx`:

```tsx
import { getFrontPageConfig } from "@/lib/front-page-store";
import { isHidden } from "@/lib/front-page";

// …inside the component, after the existing Promise.all:
const frontPage = await getFrontPageConfig();
if (isHidden("rail", frontPage)) return null;
```

Add `data-block="rail"` to the `<aside>`.

- [ ] **Step 4: Typecheck and verify the DOM contract**

Run: `npx tsc --noEmit` — expected: no output.

With the dev server up:

```bash
curl -s http://localhost:3000/ | grep -o 'data-block="[a-z]*"' | sort -u
```

Expected: `hero`, `portrait`, `about`, `spec`, `notebook`, `schooling`, `correspondence`, `pictures`, `livestrip`, `rail`.

```bash
curl -s http://localhost:3000/ | grep -c 'data-copy='
```

Expected: at least 15.

- [ ] **Step 5: Confirm the page is unchanged with an empty config**

Load `http://localhost:3000/` at 1440×900 and confirm it looks identical to before and still has zero scroll overflow:

```js
document.documentElement.scrollHeight - window.innerHeight  // expect 0
```

- [ ] **Step 6: Commit**

```bash
git add components/copy.tsx app/page.tsx components/rail.tsx
git commit -m "feat: label front-page blocks and resolve overrides"
```

---

### Task 4: The editor overlay

**Files:**
- Create: `components/page-editor.tsx`
- Modify: `app/page.tsx` (mount it for admins)
- Modify: `components/broadsheet-fx.tsx` (stand down in edit mode)
- Modify: `components/about-editor.tsx` (drop its floating button)

**Interfaces:**
- Consumes: the `data-block` / `data-copy` DOM contract from Task 3; `POST /api/admin/front-page` from Task 2.
- Produces: `<PageEditor hidden={BlockId[]} />`, and the `body[data-editing]` attribute that `broadsheet-fx` watches.

- [ ] **Step 1: Build the overlay**

Create `components/page-editor.tsx` as a client component. Required behaviour:

1. Renders a fixed pill, `✎ Edit page`, at `bottom-6 right-6 z-[190]`, styled `bg-ink text-paper` to match the FAB it replaces.
2. Toggling edit mode sets `document.body.dataset.editing = "1"` and deletes it when off.
3. In edit mode, for each `[data-block]`: a dashed accent outline and a `⋮` button at its top-right. The menu offers **Hide**, **Move up**, **Move down**; `move` is omitted for blocks with no group (`hero`, `portrait`, `livestrip`, `rail`). The `rail` menu labels Hide as `Hide (site-wide)`.
4. Blocks carrying `data-block-hidden` are ghosted (`opacity: .35`) with a `Show` chip.
5. For each `[data-copy]`: dotted underline on hover; on click set `contentEditable`, focus, and select. `Enter` without Shift, or `blur`, commits; `Escape` restores the previous text and blurs.
6. Every mutation POSTs one op to `/api/admin/front-page`, then calls `router.refresh()`. Show a `Saved` chip for ~1.5s; on a non-OK response show the returned `error` and refresh to resynchronise.
7. The pill's menu carries `Restore defaults`, sending `{op:"reset"}` behind a `confirm()`.

Implementation notes: attach listeners once in a `useEffect` keyed on edit mode, using event delegation on `document`. Position handles absolutely from `getBoundingClientRect()`, recomputed on resize — handles must not alter document flow, or toggling edit mode will reflow the page and change what you are editing.

- [ ] **Step 2: Mount it**

In `app/page.tsx`, alongside the existing admin block:

```tsx
{admin && <PageEditor hidden={frontPage.hidden} />}
```

`AboutEditor` keeps its modal form but no longer renders a floating button.

- [ ] **Step 3: Stand the FX down in edit mode**

In `components/broadsheet-fx.tsx`, at the top of the effect:

```tsx
if (document.body.dataset.editing) {
  // Reveals set opacity:0 until scrolled into view; in edit mode that
  // would mean clicking invisible blocks.
  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "none";
  });
  return;
}
```

Re-run the effect when the attribute changes: add a state counter bumped by a `MutationObserver` on `document.body` watching `attributes: ["data-editing"]`, and include that counter in the effect's dependency array.

- [ ] **Step 4: Remove the duplicate FAB**

In `components/about-editor.tsx`, delete the `fixed bottom-6 right-6` button (currently around line 45) and its open/close state, exposing the modal through a prop the overlay triggers instead. Two floating buttons in the same corner is the bug to avoid.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit` — expected: no output.

- [ ] **Step 6: Verify in the browser, logged in as admin**

Start with `ADMIN_PASSWORD=devtest npm run dev`, sign in at `/admin`, then on `/`:

1. Exactly one floating button: `document.querySelectorAll('.fixed.bottom-6.right-6').length === 1`.
2. Toggle edit mode; every block shows an outline and a `⋮`.
3. Hide `spec`; it ghosts rather than vanishing, and a `Show` chip appears.
4. In a private window (signed out), `spec` is absent: `curl -s http://localhost:3000/ | grep -c 'data-block="spec"'` → `0`.
5. Move `pictures` up; the order changes and survives a reload.
6. Edit `hero.tagline`, press Enter, reload — the new text persists.
7. `Restore defaults` returns the page to the code version.
8. Turn edit mode off; reveals animate normally again.

- [ ] **Step 7: Commit**

```bash
git add components/page-editor.tsx app/page.tsx components/broadsheet-fx.tsx components/about-editor.tsx
git commit -m "feat: on-page block editor for the front page"
```

---

### Task 5: Ship it

**Files:** none changed.

- [ ] **Step 1: Full check**

```bash
npm test && npx tsc --noEmit && npm run build
```

Expected: tests pass, no type output, build succeeds. The build needs real env — run `vercel env pull .env.local` first if `/blog` fails to prerender.

- [ ] **Step 2: Confirm a visitor sees no editor**

```bash
curl -s http://localhost:3000/ | grep -ci 'edit page'
```

Expected: `0` when signed out.

- [ ] **Step 3: Push**

```bash
git push origin main
cd .. && git add site && git commit -m "chore: bump site submodule (front-page editor)" && git push origin main
```

- [ ] **Step 4: Verify production**

Wait for the deployment, then confirm `https://www.andypandy.org/` renders and contains no `Edit page` pill when signed out.

---

## Self-Review

**Spec coverage.** Blocks and ids → Task 1 `BLOCK_IDS`, Task 3 labels. Reorder groups → Task 1 `GROUPS`/`orderedGroup`. Copy split (literals / data / derived) → Task 1 `COPY_DEFAULTS` plus Task 3's instruction to leave derived text alone; bio edits keep routing to the existing `/api/admin/about`. Data model → Task 1 `FrontPageConfig`, Task 2 store. Overlay UX → Task 4. API and validation → Tasks 1–2. Failure modes → Task 2's try/catch and Task 1's tolerant `parseConfig`. Testing → Task 1. Rollout → Task 5.

**Gap found and closed:** ghosting hidden blocks requires the server to render them for admins, which the spec implied but never stated. Task 3 Step 2 now carries the `|| admin` guard and the `data-block-hidden` marker, and Task 4 Step 1 reads that marker.

**Type consistency:** `copyFor(key, config)` takes two arguments everywhere — the spec prose showed a three-argument form, but the code default now lives in `COPY_DEFAULTS`, so the fallback parameter is gone. `orderedGroup(group, config)` and `isHidden(id, config)` are consistent across Tasks 1, 3, and 4.
