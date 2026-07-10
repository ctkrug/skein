import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { SLIDERS, clampSlider } from "../src/params";
import { encodeState, decodeState } from "../src/url";
import { simulate, percentileBands } from "../src/sim/simulate";
import { yMap } from "../src/render/scales";

/**
 * Property-based coverage for the pure math. Example tests pin known cases;
 * these assert invariants across thousands of random inputs, catching the edge
 * cases hand-written cases miss (fractional counts, extreme ranges, junk hashes).
 */

const meanSpec = SLIDERS.find((s) => s.key === "mean")!;

describe("clampSlider invariants", () => {
  it("always returns a value within the slider range for finite input", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SLIDERS),
        fc.double({ min: -1e6, max: 1e6, noNaN: true }),
        fc.double({ min: -1e6, max: 1e6, noNaN: true }),
        (spec, value, fallback) => {
          const out = clampSlider(spec, value, fallback);
          expect(out).toBeGreaterThanOrEqual(spec.min);
          expect(out).toBeLessThanOrEqual(spec.max);
        },
      ),
    );
  });

  it("returns the fallback verbatim for any non-finite input", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(NaN, Infinity, -Infinity),
        fc.double({ min: meanSpec.min, max: meanSpec.max, noNaN: true }),
        (bad, fallback) => {
          expect(clampSlider(meanSpec, bad, fallback)).toBe(fallback);
        },
      ),
    );
  });
});

describe("url round-trip invariants", () => {
  it("never decodes a value outside its slider range", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e4, max: 1e4, noNaN: true }),
        fc.double({ min: -1e4, max: 1e4, noNaN: true }),
        fc.double({ min: -1e4, max: 1e4, noNaN: true }),
        fc.integer({ min: -1e4, max: 1e4 }),
        (mean, variance, correlation, paths) => {
          const hash = encodeState(
            { mean, variance, correlation, paths, seed: 1 },
            "stock",
          );
          const { params } = decodeState(hash);
          for (const spec of SLIDERS) {
            const v = params[spec.key];
            expect(v).toBeGreaterThanOrEqual(spec.min);
            expect(v).toBeLessThanOrEqual(spec.max);
          }
          expect(Number.isInteger(params.paths)).toBe(true);
        },
      ),
    );
  });

  it("preserves in-range values through a full round-trip", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (mean, variance, c, paths50) => {
          const correlation = c / 100;
          const paths = paths50 * 50;
          const { params } = decodeState(
            encodeState({ mean, variance, correlation, paths, seed: 1 }, "x"),
          );
          expect(params.mean).toBeCloseTo(mean, 5);
          expect(params.variance).toBeCloseTo(variance, 5);
          expect(params.correlation).toBeCloseTo(correlation, 5);
          expect(params.paths).toBe(paths);
        },
      ),
    );
  });
});

describe("simulation invariants", () => {
  it("keeps percentile bands monotonic non-decreasing at every step", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ min: 0, max: 400 }),
        fc.double({ min: -1, max: 1, noNaN: true }),
        fc.integer({ min: 1, max: 5000 }),
        (mean, variance, correlation, seed) => {
          const paths = simulate({
            mean,
            variance,
            correlation,
            steps: 12,
            paths: 200,
            seed,
          });
          const bands = percentileBands(paths, [0.05, 0.25, 0.5, 0.75, 0.95]);
          for (let t = 0; t < 12; t++) {
            for (let i = 1; i < bands.length; i++) {
              expect(bands[i][t]).toBeGreaterThanOrEqual(bands[i - 1][t]);
            }
          }
        },
      ),
    );
  });

  it("starts every path exactly at the mean regardless of inputs", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -200, max: 200 }),
        fc.integer({ min: 0, max: 400 }),
        fc.double({ min: -1, max: 1, noNaN: true }),
        (mean, variance, correlation) => {
          const paths = simulate({
            mean,
            variance,
            correlation,
            steps: 6,
            paths: 10,
            seed: 2,
          });
          for (const path of paths) expect(path[0]).toBe(mean);
        },
      ),
    );
  });
});

describe("scale invariants", () => {
  it("yMap is strictly decreasing in value over a non-degenerate domain", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e3, max: 1e3, noNaN: true }),
        fc.double({ min: 1, max: 1e3, noNaN: true }),
        fc.integer({ min: 1, max: 2000 }),
        (min, span, height) => {
          const y = yMap({ min, max: min + span }, height);
          expect(y(min + span)).toBeLessThan(y(min));
        },
      ),
    );
  });
});
