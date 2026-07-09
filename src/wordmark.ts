/**
 * The masthead wordmark. Each letter is its own span so it can settle in with a
 * staggered fade + weight overshoot, as if type were being set on a press — the
 * signature detail from docs/DESIGN.md §4. Respects reduced-motion by rendering
 * fully settled with no intro.
 */

/** Per-letter animation delays in ms, spaced by `step`. Pure, so it is tested. */
export function staggerDelays(count: number, step = 40): number[] {
  return Array.from({ length: Math.max(0, count) }, (_, i) => i * step);
}

export function buildWordmark(
  text: string,
  reducedMotion: boolean,
): HTMLElement {
  const h1 = document.createElement("h1");
  h1.className = "wordmark";
  const delays = staggerDelays(text.length);
  [...text].forEach((ch, i) => {
    const span = document.createElement("span");
    span.className = "wordmark__letter";
    span.textContent = ch === " " ? " " : ch;
    if (reducedMotion) {
      span.style.opacity = "1";
    } else {
      span.style.animationDelay = `${delays[i]}ms`;
      span.classList.add("wordmark__letter--intro");
    }
    h1.appendChild(span);
  });
  return h1;
}
