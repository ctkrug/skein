import { describe, expect, it } from "vitest";
import { simulate, type PathSet } from "../src/sim/simulate";

/**
 * Pooled lag-1 autocorrelation across every path: the correlation between each
 * step's deviation from the mean and the next step's. For an AR(1) process this
 * estimates the configured `correlation` parameter, so it is the sharpest test
 * that the third slider actually does something the first two do not.
 */
function lag1Autocorrelation(paths: PathSet, mean: number): number {
  let num = 0;
  let den = 0;
  for (const path of paths) {
    for (let t = 1; t < path.length; t++) {
      const prev = path[t - 1] - mean;
      const cur = path[t] - mean;
      num += prev * cur;
      den += prev * prev;
    }
  }
  return den === 0 ? 0 : num / den;
}

describe("correlation parameter drives autocorrelation", () => {
  const run = (correlation: number) =>
    simulate({ mean: 0, variance: 1, correlation, steps: 60, paths: 3000, seed: 11 });

  it("recovers a positive setting as positive autocorrelation", () => {
    const ac = lag1Autocorrelation(run(0.7), 0);
    expect(ac).toBeGreaterThan(0.5);
    expect(ac).toBeLessThan(0.9);
  });

  it("recovers a near-zero setting as near-zero autocorrelation", () => {
    expect(Math.abs(lag1Autocorrelation(run(0), 0))).toBeLessThan(0.1);
  });

  it("recovers a negative setting as negative autocorrelation", () => {
    expect(lag1Autocorrelation(run(-0.6), 0)).toBeLessThan(-0.4);
  });

  it("increases monotonically with the correlation setting", () => {
    const lo = lag1Autocorrelation(run(-0.5), 0);
    const mid = lag1Autocorrelation(run(0.1), 0);
    const hi = lag1Autocorrelation(run(0.8), 0);
    expect(lo).toBeLessThan(mid);
    expect(mid).toBeLessThan(hi);
  });
});
