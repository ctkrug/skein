import { describe, expect, it } from "vitest";
import { bandPairs, densityAlpha } from "../src/render/fanchart";

describe("bandPairs", () => {
  it("nests symmetric pairs outermost-first with a centre median", () => {
    // 5 rows: 0.05/0.25/0.5/0.75/0.95 -> pairs (0,4) then (1,3), median 2
    const { pairs, median } = bandPairs(5);
    expect(pairs).toEqual([
      [0, 4],
      [1, 3],
    ]);
    expect(median).toBe(2);
  });

  it("reports no median for an even row count", () => {
    const { pairs, median } = bandPairs(4);
    expect(pairs).toEqual([
      [0, 3],
      [1, 2],
    ]);
    expect(median).toBe(-1);
  });

  it("handles a single median row with no fill pairs", () => {
    expect(bandPairs(1)).toEqual({ pairs: [], median: 0 });
  });
});

describe("densityAlpha", () => {
  it("fades per-path opacity as path count grows", () => {
    expect(densityAlpha(50)).toBeGreaterThan(densityAlpha(2000));
  });

  it("clamps to a legible range at the extremes", () => {
    expect(densityAlpha(1)).toBeLessThanOrEqual(0.4);
    expect(densityAlpha(1_000_000)).toBeGreaterThanOrEqual(0.015);
    expect(densityAlpha(0)).toBe(0);
  });
});
