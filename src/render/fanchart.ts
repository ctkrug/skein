import type { PathSet } from "../sim/simulate";
import { theme, withAlpha } from "../theme";
import { domainOf, xMap, yMap, type Domain } from "./scales";

/**
 * A set of percentile rows to draw as a fan. `percentiles` is sorted ascending
 * in [0, 1] (e.g. 0.05 / 0.25 / 0.5 / 0.75 / 0.95) and `rows[i]` holds that
 * percentile's value at each step. Symmetric pairs around the centre are
 * filled as nested bands; the centre percentile is stroked as the median line.
 */
export interface BandSet {
  percentiles: number[];
  rows: Float64Array[];
}

/** Options for a single frame; the app varies these to animate. */
export interface RenderOptions {
  /** Fraction of steps to draw, left to right, for the sweep-in. Default 1. */
  reveal?: number;
  /** Opacity multiplier for the filled bands, for the recompute pulse. */
  bandAlpha?: number;
}

/**
 * Index pairs `[lo, hi]` of symmetric percentile rows to fill as nested bands,
 * outermost first, plus the centre row index to stroke as the median (or -1
 * when there is an even number of rows and no exact centre).
 */
export function bandPairs(count: number): { pairs: [number, number][]; median: number } {
  const pairs: [number, number][] = [];
  const half = Math.floor(count / 2);
  for (let i = 0; i < half; i++) pairs.push([i, count - 1 - i]);
  const median = count % 2 === 1 ? half : -1;
  return { pairs, median };
}

/**
 * Draws the live fan chart onto a canvas: nested percentile bands, the raw
 * simulated paths stroked faintly on top, and the crimson median line
 * crowning it. Owns device-pixel-ratio sizing so strokes stay crisp on retina
 * and recompute correctly on resize; all drawing happens in CSS-pixel space.
 */
export class FanChart {
  private readonly ctx: CanvasRenderingContext2D;
  private cssWidth = 0;
  private cssHeight = 0;
  private dpr = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
  }

  /** CSS-pixel size of the drawing surface, for consumers like PNG export. */
  get size(): { width: number; height: number } {
    return { width: this.cssWidth, height: this.cssHeight };
  }

  /**
   * Sizes the backing store to `cssWidth × cssHeight` at the current
   * devicePixelRatio and scales the context so all subsequent drawing uses CSS
   * pixels. Call on mount and on every resize.
   */
  resize(cssWidth: number, cssHeight: number, dpr = window.devicePixelRatio || 1): void {
    this.cssWidth = cssWidth;
    this.cssHeight = cssHeight;
    this.dpr = dpr;
    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Paints the paper background over the whole surface. */
  private clear(): void {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.fillStyle = theme.bg;
    this.ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
  }

  render(paths: PathSet, bands: BandSet, opts: RenderOptions = {}): void {
    const reveal = opts.reveal ?? 1;
    const bandAlpha = opts.bandAlpha ?? 1;
    this.clear();
    if (paths.length === 0 || this.cssWidth === 0) return;

    const steps = paths[0].length;
    const domain = domainOf(bands.rows.length ? bands.rows : paths);
    const x = xMap(steps, this.cssWidth);
    const y = yMap(domain, this.cssHeight);
    const lastStep = Math.max(1, Math.floor((steps - 1) * clamp01(reveal)));

    this.drawBands(bands, x, y, lastStep, bandAlpha);
    this.drawPaths(paths, x, y, lastStep);
    this.drawMedian(bands, x, y, lastStep);
  }

  private drawBands(
    bands: BandSet,
    x: (t: number) => number,
    y: (v: number) => number,
    lastStep: number,
    bandAlpha: number,
  ): void {
    const { pairs } = bandPairs(bands.rows.length);
    const ctx = this.ctx;
    pairs.forEach(([lo, hi], depth) => {
      const upper = bands.rows[hi];
      const lower = bands.rows[lo];
      ctx.beginPath();
      ctx.moveTo(x(0), y(upper[0]));
      for (let t = 1; t <= lastStep; t++) ctx.lineTo(x(t), y(upper[t]));
      for (let t = lastStep; t >= 0; t--) ctx.lineTo(x(t), y(lower[t]));
      ctx.closePath();
      // Nested bands deepen from a translucent teal wash to a richer core.
      const alpha = (0.12 + depth * 0.14) * bandAlpha;
      ctx.fillStyle = withAlpha(theme.accentSupport, Math.min(alpha, 0.6));
      ctx.fill();
    });
  }

  private drawPaths(
    paths: PathSet,
    x: (t: number) => number,
    y: (v: number) => number,
    lastStep: number,
  ): void {
    const ctx = this.ctx;
    // Faint ink threads whose density — not any single line — reads as spread.
    ctx.strokeStyle = withAlpha(theme.ink, densityAlpha(paths.length));
    ctx.lineWidth = 1;
    for (const path of paths) {
      ctx.beginPath();
      ctx.moveTo(x(0), y(path[0]));
      for (let t = 1; t <= lastStep; t++) ctx.lineTo(x(t), y(path[t]));
      ctx.stroke();
    }
  }

  private drawMedian(
    bands: BandSet,
    x: (t: number) => number,
    y: (v: number) => number,
    lastStep: number,
  ): void {
    const { median } = bandPairs(bands.rows.length);
    if (median < 0) return;
    const row = bands.rows[median];
    const ctx = this.ctx;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x(0), y(row[0]));
    for (let t = 1; t <= lastStep; t++) ctx.lineTo(x(t), y(row[t]));
    ctx.stroke();
  }
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Per-path stroke alpha that keeps the aggregate ink density roughly constant
 * as path count scales, so 50 paths and 5,000 paths both read as a legible fan
 * rather than a blank sheet or a solid smear.
 */
export function densityAlpha(count: number): number {
  if (count <= 0) return 0;
  return clamp(6 / Math.sqrt(count), 0.015, 0.4);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export type { Domain };
