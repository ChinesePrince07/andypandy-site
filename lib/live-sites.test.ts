import { describe, expect, it } from "vitest";
import {
  moveVisibleLiveSite,
  normalizeLiveSitesConfig,
  selectVisibleLiveSites,
  setLiveSiteHidden,
} from "./live-sites";

const projects = [
  { slug: "alpha", demo: "https://alpha.example.com" },
  { slug: "hardware" },
  { slug: "beta", demo: "https://beta.example.com" },
  { slug: "gamma", demo: "https://gamma.example.com" },
];

describe("normalizeLiveSitesConfig", () => {
  it("uses source order and shows every demo project by default", () => {
    expect(normalizeLiveSitesConfig(projects, null)).toEqual({
      order: ["alpha", "beta", "gamma"],
      hidden: [],
    });
  });

  it("keeps a saved order and appends newly added demo projects", () => {
    expect(
      normalizeLiveSitesConfig(projects, {
        order: ["beta", "alpha"],
        hidden: [],
      }),
    ).toEqual({
      order: ["beta", "alpha", "gamma"],
      hidden: [],
    });
  });

  it("removes duplicates, unknown projects, and projects without live sites", () => {
    expect(
      normalizeLiveSitesConfig(projects, {
        order: ["gamma", "gamma", "missing", "hardware"],
        hidden: ["beta", "missing", "hardware", "beta"],
      }),
    ).toEqual({
      order: ["gamma", "alpha", "beta"],
      hidden: ["beta"],
    });
  });
});

describe("selectVisibleLiveSites", () => {
  it("returns visible demo projects in the configured order", () => {
    const config = normalizeLiveSitesConfig(projects, {
      order: ["gamma", "beta", "alpha"],
      hidden: ["beta"],
    });

    expect(
      selectVisibleLiveSites(projects, config).map((project) => project.slug),
    ).toEqual(["gamma", "alpha"]);
  });
});

describe("live site admin ordering", () => {
  const items = [
    { slug: "alpha", liveSiteHidden: false },
    { slug: "beta", liveSiteHidden: false },
    { slug: "gamma", liveSiteHidden: true },
  ];

  it("moves a visible site within the visible order", () => {
    expect(
      moveVisibleLiveSite(items, "beta", -1).map((item) => item.slug),
    ).toEqual(["beta", "alpha", "gamma"]);
  });

  it("does not move a site beyond the visible list boundary", () => {
    expect(moveVisibleLiveSite(items, "alpha", -1)).toEqual(items);
  });

  it("moves hidden sites after visible sites and restores them at the end", () => {
    const hidden = setLiveSiteHidden(items, "beta", true);
    expect(hidden.map((item) => item.slug)).toEqual(["alpha", "beta", "gamma"]);
    expect(hidden[1].liveSiteHidden).toBe(true);

    const restored = setLiveSiteHidden(hidden, "gamma", false);
    expect(restored.map((item) => item.slug)).toEqual([
      "alpha",
      "gamma",
      "beta",
    ]);
    expect(restored[1].liveSiteHidden).toBe(false);
  });
});
