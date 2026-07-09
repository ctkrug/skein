import { describe, expect, it } from "vitest";
import { PRESETS, presetById, DEFAULT_PRESET_ID } from "../src/presets";
import { SLIDERS } from "../src/params";

describe("presets", () => {
  it("ships at least three domains with distinct starting values", () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(3);
    const triples = PRESETS.map(
      (p) => `${p.values.mean},${p.values.variance},${p.values.correlation}`,
    );
    expect(new Set(triples).size).toBe(triples.length);
  });

  it("keeps every preset value inside its slider range", () => {
    const range = (key: string) => SLIDERS.find((s) => s.key === key)!;
    for (const p of PRESETS) {
      for (const key of ["mean", "variance", "correlation"] as const) {
        const spec = range(key);
        expect(p.values[key]).toBeGreaterThanOrEqual(spec.min);
        expect(p.values[key]).toBeLessThanOrEqual(spec.max);
      }
    }
  });

  it("resolves a known id and rejects an unknown one", () => {
    expect(presetById(DEFAULT_PRESET_ID)).toBeDefined();
    expect(presetById("nope")).toBeUndefined();
  });

  it("gives every preset non-empty caption and axis labels", () => {
    for (const p of PRESETS) {
      expect(p.caption.length).toBeGreaterThan(0);
      expect(p.unit.length).toBeGreaterThan(0);
      expect(p.stepLabel.length).toBeGreaterThan(0);
    }
  });
});
