import { describe, expect, it } from "vitest";
import { domainOf, xMap, yMap } from "../src/render/scales";

describe("domainOf", () => {
  it("covers the min and max across all rows, with padding", () => {
    const rows = [Float64Array.from([0, 10]), Float64Array.from([-5, 5])];
    const d = domainOf(rows, 0.1);
    // raw span is [-5, 10] (15 wide); padded by 1.5 on each side
    expect(d.min).toBeCloseTo(-6.5);
    expect(d.max).toBeCloseTo(11.5);
  });

  it("expands a flat data set to a visible window", () => {
    const d = domainOf([Float64Array.from([7, 7, 7])]);
    expect(d.min).toBe(6.5);
    expect(d.max).toBe(7.5);
  });

  it("falls back to a unit window for empty input", () => {
    expect(domainOf([])).toEqual({ min: 0, max: 1 });
    expect(domainOf([new Float64Array(0)])).toEqual({ min: 0, max: 1 });
  });
});

describe("xMap", () => {
  it("maps the first and last step to the full width", () => {
    const x = xMap(11, 500);
    expect(x(0)).toBe(0);
    expect(x(10)).toBe(500);
    expect(x(5)).toBe(250);
  });

  it("collapses a single-step path to the left edge", () => {
    expect(xMap(1, 500)(0)).toBe(0);
  });
});

describe("yMap", () => {
  it("inverts so larger values sit higher (smaller y)", () => {
    const y = yMap({ min: 0, max: 100 }, 200);
    expect(y(100)).toBe(0);
    expect(y(0)).toBe(200);
    expect(y(50)).toBe(100);
  });

  it("centres everything when the domain is degenerate", () => {
    expect(yMap({ min: 5, max: 5 }, 300)(5)).toBe(150);
  });
});
