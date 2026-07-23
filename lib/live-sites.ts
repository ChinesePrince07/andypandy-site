export interface LiveSitesConfig {
  order: string[];
  hidden: string[];
}

interface LiveSiteProject {
  slug: string;
  demo?: string;
}

function uniqueKnownSlugs(values: unknown, known: Set<string>): string[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  return values.filter((value): value is string => {
    if (typeof value !== "string" || !known.has(value) || seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

export function normalizeLiveSitesConfig(
  projects: LiveSiteProject[],
  config: Partial<LiveSitesConfig> | null,
): LiveSitesConfig {
  const defaultOrder = projects
    .filter((project) => project.demo)
    .map((project) => project.slug);
  const known = new Set(defaultOrder);
  const savedOrder = uniqueKnownSlugs(config?.order, known);
  const saved = new Set(savedOrder);

  return {
    order: [
      ...savedOrder,
      ...defaultOrder.filter((slug) => !saved.has(slug)),
    ],
    hidden: uniqueKnownSlugs(config?.hidden, known),
  };
}
