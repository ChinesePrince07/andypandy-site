import { describe, expect, it } from "vitest";
import {
  normalizeLiveSitesConfig,
  selectVisibleLiveSites,
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
