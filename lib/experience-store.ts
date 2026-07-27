import { unstable_cache } from "next/cache";
import { r2GetText, r2Put } from "./r2-storage";
import { experience as defaults, type Experience } from "./experience";

const EXPERIENCE_KEY = "content/experience.json";

/** Saved entries win field by field; anything never saved falls back to the
 *  code list, so a missing or corrupt file still prints the paper. */
function merge(raw: unknown): Experience[] {
  if (!Array.isArray(raw)) return defaults;
  const saved = new Map<string, Partial<Experience>>();
  for (const e of raw) {
    if (e && typeof e === "object" && typeof (e as Experience).slug === "string") {
      saved.set((e as Experience).slug, e as Partial<Experience>);
    }
  }
  return defaults.map((d) => ({ ...d, ...(saved.get(d.slug) ?? {}) }));
}

const load = unstable_cache(
  async (): Promise<Experience[]> => {
    try {
      const text = await r2GetText(EXPERIENCE_KEY);
      return text ? merge(JSON.parse(text)) : defaults;
    } catch {
      return defaults;
    }
  },
  ["experience-entries"],
  { tags: ["experience"], revalidate: 60 },
);

export async function getExperienceEntries(): Promise<Experience[]> {
  return load();
}

export async function getExperienceEntry(
  slug: string,
): Promise<Experience | undefined> {
  return (await load()).find((e) => e.slug === slug);
}

export async function saveExperienceEntries(all: Experience[]): Promise<void> {
  await r2Put(
    EXPERIENCE_KEY,
    JSON.stringify(all, null, 2),
    "application/json; charset=utf-8",
  );
}
