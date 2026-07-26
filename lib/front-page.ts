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
  "notebook.kicker": "From the blog",
  "schooling.kicker": "Schooling",
  "correspondence.kicker": "Correspondence",
  "pictures.kicker": "Pictures",
  "pictures.title": "pics.andypandy.org",
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
  return value.replace(/[\x00-\x1f]/g, "").slice(0, MAX_COPY_LENGTH);
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
      const seen = new Set<BlockId>();
      const known: BlockId[] = [];
      for (const id of ids) {
        if (isBlockId(id) && groupOf(id) === g && !seen.has(id)) {
          seen.add(id);
          known.push(id);
        }
      }
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
