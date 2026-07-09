/**
 * Pure coordinate math for the fan-chart renderer. Kept DOM-free so the
 * value→pixel mapping can be unit-tested without a canvas: the renderer is a
 * thin consumer of these functions.
 */

/** A closed numeric interval `[min, max]` in data space. */
export interface Domain {
  min: number;
  max: number;
}

/**
 * The tightest interval covering every value in `rows`, expanded by `pad`
 * (a fraction of the raw span) on each side so strokes never touch the edge.
 * A flat data set (min === max) is padded to a unit-tall window so a
 * zero-variance run still renders a visible horizontal line.
 */
export function domainOf(rows: ArrayLike<number>[], pad = 0.08): Domain {
  let min = Infinity;
  let max = -Infinity;
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const v = row[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }
  const span = max - min;
  if (span === 0) return { min: min - 0.5, max: max + 0.5 };
  return { min: min - span * pad, max: max + span * pad };
}

/** A symmetric interval `[center - half, center + half]`. */
export function centeredDomain(center: number, half: number): Domain {
  const h = Math.max(half, 1e-6);
  return { min: center - h, max: center + h };
}

/**
 * Half-height of a *stable* fan-chart frame, centered on the process mean.
 *
 * The frame must not simply hug the data, or raising variance would rescale the
 * whole view and the cone would never appear to widen. Instead we size the
 * frame to the spread the process would reach at `maxVariance`, estimated by
 * scaling the current spread (`devRef`, the largest deviation of the outer band
 * from the mean) by `sqrt(maxVariance / variance)`. Because `devRef` grows
 * roughly like `sqrt(variance)`, the resulting half-height is nearly constant
 * across the variance slider — so the band fills a `~sqrt(variance/maxVariance)`
 * fraction of a steady frame, and dragging variance visibly opens or closes the
 * cone. `minHalf` keeps a zero-variance run from collapsing to nothing.
 */
export function frameHalfHeight(
  devRef: number,
  variance: number,
  maxVariance: number,
  margin = 1.15,
  minHalf = 0.5,
): number {
  const varEff = Math.max(variance, maxVariance * 0.001);
  const half = margin * devRef * Math.sqrt(maxVariance / varEff);
  return Math.max(half, minHalf);
}

/** Largest deviation of `rows`' outermost pair from `center`, for framing. */
export function outerDeviation(rows: Float64Array[], center: number): number {
  if (rows.length === 0) return 0;
  const lo = rows[0];
  const hi = rows[rows.length - 1];
  let dev = 0;
  for (let t = 0; t < hi.length; t++) {
    dev = Math.max(dev, Math.abs(hi[t] - center), Math.abs(center - lo[t]));
  }
  return dev;
}

/**
 * A left-to-right mapping from step index `t` in `[0, steps - 1]` to an x
 * pixel in `[0, width]`. A single-step path collapses to the left edge.
 */
export function xMap(steps: number, width: number): (t: number) => number {
  if (steps <= 1) return () => 0;
  const scale = width / (steps - 1);
  return (t) => t * scale;
}

/**
 * A value→y-pixel mapping over `domain`, inverted so larger values sit higher
 * on screen (smaller y). A degenerate domain maps everything to the vertical
 * centre rather than dividing by zero.
 */
export function yMap(domain: Domain, height: number): (v: number) => number {
  const span = domain.max - domain.min;
  if (span === 0) return () => height / 2;
  const scale = height / span;
  return (v) => height - (v - domain.min) * scale;
}
