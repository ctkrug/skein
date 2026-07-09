import { randomNormal, randomLcg } from "d3-random";

/** Parameters for a Monte Carlo path sweep, independent of any domain. */
export interface SimParams {
  /** Per-step drift toward (or away from) the process mean. */
  mean: number;
  /** Per-step variance of the random shock. */
  variance: number;
  /**
   * Step-to-step correlation, in [-1, 1]. At 0 each step is an independent
   * draw around `mean`; near 1 the path mean-reverts slowly (long, smooth
   * swings); near -1 it oscillates step to step.
   */
  correlation: number;
  /** Number of steps per simulated path. */
  steps: number;
  /** Number of independent paths to simulate. */
  paths: number;
  /** Optional seed for reproducible runs; omit for a fresh random draw. */
  seed?: number;
}

/**
 * One simulated path per row: `result[p][t]` is the value of path `p` at
 * step `t`. Row 0 of every path starts at `mean` so all paths fan out from
 * a common origin.
 */
export type PathSet = Float64Array[];

/**
 * Generates `params.paths` independent Monte Carlo paths of `params.steps`
 * steps each, using a discrete AR(1)-style process:
 *
 *   x[0]   = mean
 *   x[t]   = mean + correlation * (x[t-1] - mean) + noise
 *   noise ~ Normal(0, variance)
 *
 * `correlation` controls how much of the previous step's deviation from the
 * mean carries forward, which is what makes this a general-purpose sandbox:
 * the same three numbers describe a mean-reverting timeline slip, a choppy
 * win/loss streak, or an independent coin-flip series, without any
 * domain-specific modeling.
 */
export function simulate(params: SimParams): PathSet {
  const { mean, variance, correlation, steps, paths, seed } = params;
  if (steps < 1) throw new RangeError("steps must be >= 1");
  if (paths < 1) throw new RangeError("paths must be >= 1");
  if (variance < 0) throw new RangeError("variance must be >= 0");
  if (correlation < -1 || correlation > 1) {
    throw new RangeError("correlation must be in [-1, 1]");
  }

  const stdDev = Math.sqrt(variance);
  const source = seed === undefined ? Math.random : randomLcg(seed);
  const noise = randomNormal.source(source)(0, stdDev);

  const result: PathSet = new Array(paths);
  for (let p = 0; p < paths; p++) {
    const path = new Float64Array(steps);
    path[0] = mean;
    for (let t = 1; t < steps; t++) {
      const prevDeviation = path[t - 1] - mean;
      path[t] = mean + correlation * prevDeviation + noise();
    }
    result[p] = path;
  }
  return result;
}

/**
 * Per-step percentiles across a set of paths, e.g. for a fan chart's
 * 5/25/50/75/95 bands. `percentiles` must be sorted ascending in [0, 1].
 */
export function percentileBands(
  paths: PathSet,
  percentiles: number[],
): Float64Array[] {
  if (paths.length === 0) return percentiles.map(() => new Float64Array(0));
  const steps = paths[0].length;
  const bands = percentiles.map(() => new Float64Array(steps));
  const column = new Float64Array(paths.length);

  for (let t = 0; t < steps; t++) {
    for (let p = 0; p < paths.length; p++) column[p] = paths[p][t];
    const sorted = Float64Array.from(column).sort();
    percentiles.forEach((q, i) => {
      bands[i][t] = quantile(sorted, q);
    });
  }
  return bands;
}

/** Linear-interpolation quantile of an already-sorted array. */
function quantile(sorted: Float64Array, q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  const frac = pos - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}
