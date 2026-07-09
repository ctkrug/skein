/**
 * Small pure formatting helpers shared by the readout panel and the PNG export
 * filename. Kept DOM-free and unit-tested so the display layer stays dumb.
 */

/** Formats a number for the stat readout: no decimals past ~100, else one. */
export function formatValue(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return v.toFixed(digits);
}

/** Formats a signed number with an explicit leading sign, e.g. "+0.35". */
export function formatSigned(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "±";
  return `${sign}${Math.abs(v).toFixed(2)}`;
}

/**
 * A filesystem-safe PNG filename for an export, e.g.
 * `scenario-loom-volatile-stock.png`. Falls back to a generic slug when the
 * preset name is empty or all punctuation.
 */
export function exportFilename(presetName: string): string {
  const slug = presetName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `scenario-loom-${slug || "scenario"}.png`;
}
