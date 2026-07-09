import { describe, expect, it } from "vitest";
import { easeOutCubic } from "../src/dom";

describe("easeOutCubic", () => {
  it("pins the endpoints", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it("decelerates — past the halfway value at the midpoint", () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});
