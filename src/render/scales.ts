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
