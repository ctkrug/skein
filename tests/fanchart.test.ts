import { describe, expect, it } from "vitest";
import { bandPairs, densityAlpha, FanChart } from "../src/render/fanchart";
import { simulate, percentileBands } from "../src/sim/simulate";

/** A 2D context that tallies the draw calls a render makes, DOM-free. */
function recordingContext() {
  const calls: Record<string, number> = {};
  const bump = (name: string) => (calls[name] = (calls[name] ?? 0) + 1);
  const ctx = {
    calls,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    lineJoin: "",
    setTransform: () => bump("setTransform"),
    fillRect: () => bump("fillRect"),
    beginPath: () => bump("beginPath"),
    closePath: () => bump("closePath"),
    moveTo: () => bump("moveTo"),
    lineTo: () => bump("lineTo"),
    fill: () => bump("fill"),
    stroke: () => bump("stroke"),
  };
  return ctx;
}

/** A minimal canvas stand-in exposing just what FanChart touches. */
function fakeCanvas(ctx: ReturnType<typeof recordingContext>) {
  return {
    width: 0,
    height: 0,
    style: {} as Record<string, string>,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
}

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

describe("FanChart.render", () => {
  const percentiles = [0.05, 0.25, 0.5, 0.75, 0.95];
  const paths = simulate({
    mean: 0,
    variance: 25,
    correlation: 0.3,
    steps: 20,
    paths: 40,
    seed: 1,
  });
  const bands = { percentiles, rows: percentileBands(paths, percentiles) };

  it("paints bands, every path, and the median onto the surface", () => {
    const ctx = recordingContext();
    const chart = new FanChart(fakeCanvas(ctx));
    chart.resize(300, 150, 2);
    chart.render(paths, bands, { domain: { min: -30, max: 30 } });

    // Paper fill (clear) happens once; two band pairs + median each stroke/fill.
    expect(ctx.calls.fillRect).toBe(1);
    // One fill per band pair (2) and one stroke per path (40) plus median (1).
    expect(ctx.calls.fill).toBe(2);
    expect(ctx.calls.stroke).toBe(paths.length + 1);
  });

  it("sizes the backing store to devicePixelRatio", () => {
    const ctx = recordingContext();
    const canvas = fakeCanvas(ctx);
    const chart = new FanChart(canvas);
    chart.resize(300, 150, 2);
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(300);
    expect(chart.size).toEqual({ width: 300, height: 150 });
  });

  it("draws nothing but the paper when there are no paths", () => {
    const ctx = recordingContext();
    const chart = new FanChart(fakeCanvas(ctx));
    chart.resize(300, 150, 1);
    chart.render([], { percentiles, rows: [] });
    expect(ctx.calls.fillRect).toBe(1);
    expect(ctx.calls.stroke).toBeUndefined();
  });

  it("reveals only a left slice when reveal < 1", () => {
    const full = recordingContext();
    const partial = recordingContext();
    const chartFull = new FanChart(fakeCanvas(full));
    chartFull.resize(300, 150, 1);
    chartFull.render(paths, bands, { domain: { min: -30, max: 30 } });
    const chartPartial = new FanChart(fakeCanvas(partial));
    chartPartial.resize(300, 150, 1);
    chartPartial.render(paths, bands, {
      domain: { min: -30, max: 30 },
      reveal: 0.25,
    });
    // Fewer segments drawn when the sweep only reveals a quarter of the steps.
    expect(partial.calls.lineTo).toBeLessThan(full.calls.lineTo);
  });
});
