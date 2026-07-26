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
