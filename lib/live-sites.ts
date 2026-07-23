export interface LiveSitesConfig {
  order: string[];
  hidden: string[];
}

interface LiveSiteProject {
  slug: string;
  demo?: string;
}

interface LiveSiteAdminItem {
  slug: string;
  liveSiteHidden: boolean;
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

export function selectVisibleLiveSites<T extends LiveSiteProject>(
  projects: T[],
  config: LiveSitesConfig,
): T[] {
  const bySlug = new Map(projects.map((project) => [project.slug, project]));
  const hidden = new Set(config.hidden);

  return config.order.flatMap((slug) => {
    const project = bySlug.get(slug);
    return project?.demo && !hidden.has(slug) ? [project] : [];
  });
}

export function moveVisibleLiveSite<T extends LiveSiteAdminItem>(
  items: T[],
  slug: string,
  direction: -1 | 1,
): T[] {
  const visible = items.filter((item) => !item.liveSiteHidden);
  const hidden = items.filter((item) => item.liveSiteHidden);
  const index = visible.findIndex((item) => item.slug === slug);
  const target = index + direction;

  if (index < 0 || target < 0 || target >= visible.length) {
    return items;
  }

  [visible[index], visible[target]] = [visible[target], visible[index]];
  return [...visible, ...hidden];
}

export function setLiveSiteHidden<T extends LiveSiteAdminItem>(
  items: T[],
  slug: string,
  hidden: boolean,
): T[] {
  const updated = items.map((item) =>
    item.slug === slug ? { ...item, liveSiteHidden: hidden } : item,
  );
  return [
    ...updated.filter((item) => !item.liveSiteHidden),
    ...updated.filter((item) => item.liveSiteHidden),
  ];
}
