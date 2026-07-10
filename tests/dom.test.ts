import { afterEach, describe, expect, it } from "vitest";
import { easeOutCubic, prefersReducedMotion } from "../src/dom";

describe("easeOutCubic", () => {
  it("pins the endpoints", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it("decelerates — past the halfway value at the midpoint", () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe("prefersReducedMotion", () => {
  const original = globalThis.matchMedia;

  afterEach(() => {
    globalThis.matchMedia = original;
  });

  it("reflects a true match from matchMedia", () => {
    globalThis.matchMedia = (() => ({ matches: true })) as never;
    expect(prefersReducedMotion()).toBe(true);
  });

  it("reflects a false match from matchMedia", () => {
    globalThis.matchMedia = (() => ({ matches: false })) as never;
    expect(prefersReducedMotion()).toBe(false);
  });

  it("defaults to false when matchMedia is unavailable", () => {
    // @ts-expect-error -- simulating an environment with no matchMedia
    delete globalThis.matchMedia;
    expect(prefersReducedMotion()).toBe(false);
  });
});
