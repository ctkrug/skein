import { describe, expect, it } from "vitest";
import { simulate, percentileBands } from "../src/sim/simulate";
import {
  frameHalfHeight,
  outerDeviation,
  centeredDomain,
  yMap,
} from "../src/render/scales";

const MEAN = 100;
const MAX_VAR = 400;
const PCTS = [0.05, 0.5, 0.95];

/** Pixel width of the p05–p95 band at the last step, under the stable frame. */
function bandPixelWidth(variance: number, height = 600): number {
  const paths = simulate({
    mean: MEAN,
    variance,
    correlation: 0.4,
    steps: 60,
    paths: 2000,
    seed: 5,
  });
  const rows = percentileBands(paths, PCTS);
  const dev = outerDeviation(rows, MEAN);
  const half = frameHalfHeight(dev, variance, MAX_VAR);
  const y = yMap(centeredDomain(MEAN, half), height);
  const last = rows[0].length - 1;
  return Math.abs(y(rows[2][last]) - y(rows[0][last]));
}

describe("frame keeps the cone responsive to variance", () => {
  it("widens the p05-p95 band pixel width as variance rises (WOW MOMENT)", () => {
    const narrow = bandPixelWidth(40);
    const wide = bandPixelWidth(360);
    // The band must open by a clear, visible margin, not stay flat.
    expect(wide).toBeGreaterThan(narrow * 1.8);
  });

  it("never lets a band exceed the frame it is drawn in", () => {
    const height = 600;
    const width = bandPixelWidth(MAX_VAR, height);
    expect(width).toBeLessThanOrEqual(height);
  });

  it("collapses toward a flat line at zero variance", () => {
    expect(bandPixelWidth(0)).toBeLessThan(2);
  });
});

describe("frameHalfHeight", () => {
  it("floors the half-height so a flat run still has a frame", () => {
    expect(frameHalfHeight(0, 0, MAX_VAR)).toBeGreaterThan(0);
  });

  it("shrinks for a fixed spread as variance grows (steady frame)", () => {
    // Holding devRef fixed, more variance means the same spread fills more of
    // the frame, so the frame itself is smaller.
    expect(frameHalfHeight(50, 100, MAX_VAR)).toBeGreaterThan(
      frameHalfHeight(50, 400, MAX_VAR),
    );
  });
});
