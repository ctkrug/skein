import { SLIDERS, clampSlider, DEFAULT_PARAMS, type ScenarioParams } from "./params";

/**
 * Serializes a scenario into a compact hash fragment such as
 * `#m=100&v=120&c=0.5&n=2000&p=stock`. Kept in the hash (not the query) so
 * updating it never triggers a navigation or reload, and stays purely
 * client-side for a static, backend-free deploy.
 */
export function encodeState(params: ScenarioParams, presetId: string): string {
  const q = new URLSearchParams({
    m: round(params.mean),
    v: round(params.variance),
    c: round(params.correlation),
    n: String(params.paths),
    p: presetId,
  });
  return `#${q.toString()}`;
}

/** A decoded scenario plus the preset id that framed it. */
export interface DecodedState {
  params: ScenarioParams;
  presetId: string | null;
}

/**
 * Parses a hash fragment back into a scenario, clamping every value into its
 * slider range and falling back to {@link DEFAULT_PARAMS} for anything missing
 * or malformed. A junk hash therefore yields a valid default scenario, never a
 * thrown error or a blank chart.
 */
export function decodeState(hash: string): DecodedState {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  const spec = (key: string) => SLIDERS.find((s) => s.key === key)!;
  const num = (raw: string | null, fallback: number, key: string) => {
    // Treat missing or blank as absent so `v=` (Number("") === 0) falls back
    // to the default rather than silently snapping the slider to zero.
    const value = raw === null || raw.trim() === "" ? NaN : Number(raw);
    return clampSlider(spec(key), value, fallback);
  };

  const params: ScenarioParams = {
    mean: num(q.get("m"), DEFAULT_PARAMS.mean, "mean"),
    variance: num(q.get("v"), DEFAULT_PARAMS.variance, "variance"),
    correlation: num(q.get("c"), DEFAULT_PARAMS.correlation, "correlation"),
    paths: num(q.get("n"), DEFAULT_PARAMS.paths, "paths"),
    seed: DEFAULT_PARAMS.seed,
  };
  return { params, presetId: q.get("p") };
}

function round(v: number): string {
  return String(Math.round(v * 100) / 100);
}
