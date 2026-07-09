import type { SimParams } from "./sim/simulate";

/**
 * The full parameter set the app owns: the three headline sliders (mean,
 * variance, correlation) plus the path count and a reproducibility seed. This
 * is a superset of {@link SimParams} — {@link toSimParams} narrows it down to
 * exactly what the domain-agnostic core needs, keeping the sim honest.
 */
export interface ScenarioParams {
  mean: number;
  variance: number;
  correlation: number;
  paths: number;
  seed: number;
}

/** Fixed horizon: every path is this many steps long. */
export const STEPS = 60;

/** One draggable control's shape, driven entirely by data (no domain logic). */
export interface SliderSpec {
  key: "mean" | "variance" | "correlation" | "paths";
  label: string;
  min: number;
  max: number;
  step: number;
}

/**
 * The four sliders, in display order. Ranges are deliberately generous so a
 * preset can reframe them without ever hitting an edge, and so the wow-moment
 * variance sweep spans a visibly wide cone.
 */
export const SLIDERS: readonly SliderSpec[] = [
  { key: "mean", label: "Mean", min: 0, max: 200, step: 1 },
  { key: "variance", label: "Variance", min: 0, max: 400, step: 1 },
  { key: "correlation", label: "Correlation", min: -1, max: 1, step: 0.01 },
  { key: "paths", label: "Paths", min: 50, max: 5000, step: 50 },
] as const;

/** A sensible neutral starting scenario, used before any preset is applied. */
export const DEFAULT_PARAMS: ScenarioParams = {
  mean: 100,
  variance: 120,
  correlation: 0.5,
  paths: 2000,
  seed: 1,
};

/**
 * Clamps one slider value into its declared range, snapping `NaN`/missing
 * input back to the current value so a malformed URL or input event can never
 * push the simulation into an invalid state.
 */
export function clampSlider(
  spec: SliderSpec,
  value: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(spec.max, Math.max(spec.min, value));
}

/** Narrows the app's params to exactly the domain-agnostic simulation inputs. */
export function toSimParams(p: ScenarioParams): SimParams {
  return {
    mean: p.mean,
    variance: p.variance,
    correlation: p.correlation,
    steps: STEPS,
    paths: p.paths,
    seed: p.seed,
  };
}
