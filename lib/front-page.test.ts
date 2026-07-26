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

  it("dedupes repeated ids in a saved order", () => {
    expect(
      parseConfig({ order: { sidebar: ["pictures", "pictures", "schooling"] } }),
    ).toEqual({
      hidden: [],
      order: { sidebar: ["pictures", "schooling"] },
      copy: {},
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

  it("keeps every block when the saved order repeats one", () => {
    const c = parseConfig({ order: { sidebar: ["pictures", "pictures"] } });
    expect(orderedGroup("sidebar", c)).toEqual([
      "pictures",
      "schooling",
      "correspondence",
    ]);
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
