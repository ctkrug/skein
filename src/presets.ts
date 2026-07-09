import type { ScenarioParams } from "./params";

/**
 * A preset is pure UI framing: a name, a caption, axis labels, and starting
 * slider values. It never changes how {@link simulate} runs — that is the whole
 * point of the sandbox. Swapping presets only sets the three headline params
 * (mean/variance/correlation) and the copy around the chart, so the domain
 * lives entirely in the labels, never in the math.
 */
export interface Preset {
  id: string;
  name: string;
  /** One-line editorial caption shown under the chart. */
  caption: string;
  /** Y-axis label — what the value on each path represents in this framing. */
  unit: string;
  /** X-axis label — what a "step" means in this framing. */
  stepLabel: string;
  values: Pick<ScenarioParams, "mean" | "variance" | "correlation">;
}

/**
 * The shipped presets. Distinct mean/variance/correlation triples so switching
 * visibly reshapes the cone: a mean-reverting stock, a slipping project
 * timeline, a streaky shooter, and a memoryless coin-flip baseline.
 */
export const PRESETS: readonly Preset[] = [
  {
    id: "stock",
    name: "Volatile stock",
    caption: "A jumpy share price with mild pull back toward its average.",
    unit: "Price",
    stepLabel: "Trading day",
    values: { mean: 100, variance: 160, correlation: 0.35 },
  },
  {
    id: "project",
    name: "Slipping timeline",
    caption: "Task estimates that drift and compound — momentum carries.",
    unit: "Days remaining",
    stepLabel: "Check-in",
    values: { mean: 80, variance: 90, correlation: 0.75 },
  },
  {
    id: "streak",
    name: "Streaky shooter",
    caption: "A scorer whose hot and cold nights flip fast, game to game.",
    unit: "Points",
    stepLabel: "Game",
    values: { mean: 24, variance: 220, correlation: -0.4 },
  },
  {
    id: "coin",
    name: "Coin-flip baseline",
    caption: "Independent draws — no memory at all between steps.",
    unit: "Value",
    stepLabel: "Trial",
    values: { mean: 100, variance: 120, correlation: 0 },
  },
] as const;

/** The preset shown on first load. */
export const DEFAULT_PRESET_ID = "stock";

/** Looks up a preset by id, or `undefined` if the id is unknown. */
export function presetById(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
