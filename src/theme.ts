/**
 * Design tokens from `docs/DESIGN.md`, mirrored here so the canvas renderer
 * (which paints outside the DOM/CSS cascade) draws with the exact same palette
 * the stylesheet uses. Editorial data-journalism broadsheet: warm ivory paper,
 * ink-navy text, one confident crimson accent, a deep-teal support accent.
 */
export const theme = {
  bg: "#f4ede1",
  surface1: "#ece2d0",
  surface2: "#e2d5bd",
  ink: "#241f1a",
  inkMuted: "#6b6153",
  accent: "#b3311f",
  accentSupport: "#2b5a63",
  success: "#3f7a4e",
  danger: "#b3311f",
} as const;

export type ThemeToken = keyof typeof theme;

/** `rgba()` string for a hex token at a given alpha — for canvas fills. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
