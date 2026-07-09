import { describe, expect, it } from "vitest";
import { percentileBands, simulate } from "../src/sim/simulate";

describe("simulate", () => {
  it("starts every path at the configured mean", () => {
    const paths = simulate({
      mean: 100,
      variance: 4,
      correlation: 0.5,
      steps: 10,
      paths: 20,
      seed: 1,
    });
    for (const path of paths) {
      expect(path[0]).toBe(100);
    }
  });

  it("produces the requested shape", () => {
    const paths = simulate({
      mean: 0,
      variance: 1,
      correlation: 0,
      steps: 50,
      paths: 30,
      seed: 42,
    });
    expect(paths).toHaveLength(30);
    for (const path of paths) expect(path).toHaveLength(50);
  });

  it("is reproducible for a given seed", () => {
    const params = {
      mean: 10,
      variance: 2,
      correlation: 0.3,
      steps: 25,
      paths: 5,
      seed: 7,
    };
    const a = simulate(params);
    const b = simulate(params);
    for (let p = 0; p < a.length; p++) {
      expect(Array.from(b[p])).toEqual(Array.from(a[p]));
    }
  });

  it("converges to the configured mean across many paths", () => {
    const paths = simulate({
      mean: 50,
      variance: 9,
      correlation: 0.2,
      steps: 40,
      paths: 4000,
      seed: 99,
    });
    const lastStep = paths.map((p) => p[p.length - 1]);
    const avg = lastStep.reduce((a, b) => a + b, 0) / lastStep.length;
    expect(avg).toBeCloseTo(50, 0);
  });

  it("widens the spread across paths as variance increases", () => {
    const spreadOf = (variance: number) => {
      const paths = simulate({
        mean: 0,
        variance,
        correlation: 0,
        steps: 20,
        paths: 2000,
        seed: 5,
      });
      const lastStep = paths.map((p) => p[p.length - 1]);
      const mean = lastStep.reduce((a, b) => a + b, 0) / lastStep.length;
      const variance_ =
        lastStep.reduce((acc, x) => acc + (x - mean) ** 2, 0) / lastStep.length;
      return Math.sqrt(variance_);
    };
    expect(spreadOf(16)).toBeGreaterThan(spreadOf(1));
  });

  it("rejects out-of-range correlation", () => {
    expect(() =>
      simulate({
        mean: 0,
        variance: 1,
        correlation: 1.5,
        steps: 10,
        paths: 1,
      }),
    ).toThrow(RangeError);
  });

  it("rejects negative variance", () => {
    expect(() =>
      simulate({
        mean: 0,
        variance: -1,
        correlation: 0,
        steps: 10,
        paths: 1,
      }),
    ).toThrow(RangeError);
  });

  it("floors a fractional path count instead of throwing on a bad length", () => {
    // A hand-edited hash like `#n=137.5` reaches simulate as a float; a naive
    // `new Array(137.5)` throws "Invalid array length" and white-screens the app.
    const paths = simulate({
      mean: 0,
      variance: 1,
      correlation: 0,
      steps: 5,
      paths: 137.5,
      seed: 1,
    });
    expect(paths).toHaveLength(137);
  });

  it("floors a fractional step count to whole steps", () => {
    const paths = simulate({
      mean: 0,
      variance: 1,
      correlation: 0,
      steps: 8.9,
      paths: 3,
      seed: 1,
    });
    for (const path of paths) expect(path).toHaveLength(8);
  });
});

describe("percentileBands", () => {
  it("orders bands so lower percentiles never exceed higher ones", () => {
    const paths = simulate({
      mean: 0,
      variance: 25,
      correlation: 0.4,
      steps: 30,
      paths: 1000,
      seed: 3,
    });
    const [p05, p50, p95] = percentileBands(paths, [0.05, 0.5, 0.95]);
    for (let t = 0; t < p50.length; t++) {
      expect(p05[t]).toBeLessThanOrEqual(p50[t]);
      expect(p50[t]).toBeLessThanOrEqual(p95[t]);
    }
  });

  it("returns a degenerate band for a single path", () => {
    const paths = simulate({
      mean: 5,
      variance: 0,
      correlation: 0,
      steps: 4,
      paths: 1,
      seed: 1,
    });
    const [median] = percentileBands(paths, [0.5]);
    expect(Array.from(median)).toEqual([5, 5, 5, 5]);
  });
});
