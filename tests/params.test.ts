import { describe, expect, it } from "vitest";
import {
  SLIDERS,
  clampSlider,
  toSimParams,
  DEFAULT_PARAMS,
  STEPS,
} from "../src/params";

const spec = (key: string) => SLIDERS.find((s) => s.key === key)!;

describe("clampSlider", () => {
  it("passes an in-range value through untouched", () => {
    expect(clampSlider(spec("mean"), 120, 100)).toBe(120);
  });

  it("clamps below min and above max to the bounds", () => {
    expect(clampSlider(spec("correlation"), -5, 0)).toBe(-1);
    expect(clampSlider(spec("correlation"), 5, 0)).toBe(1);
  });

  it("falls back on non-finite input rather than corrupting state", () => {
    expect(clampSlider(spec("variance"), NaN, 42)).toBe(42);
    expect(clampSlider(spec("variance"), Infinity, 42)).toBe(400);
  });
});

describe("toSimParams", () => {
  it("carries the three headline params plus the fixed horizon", () => {
    const sim = toSimParams(DEFAULT_PARAMS);
    expect(sim.mean).toBe(DEFAULT_PARAMS.mean);
    expect(sim.variance).toBe(DEFAULT_PARAMS.variance);
    expect(sim.correlation).toBe(DEFAULT_PARAMS.correlation);
    expect(sim.steps).toBe(STEPS);
    expect(sim.paths).toBe(DEFAULT_PARAMS.paths);
  });

  it("exposes no app-only fields to the sim core", () => {
    const sim = toSimParams(DEFAULT_PARAMS);
    expect(Object.keys(sim).sort()).toEqual(
      ["correlation", "mean", "paths", "seed", "steps", "variance"].sort(),
    );
  });
});
