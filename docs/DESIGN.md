# Design

## 1. Aesthetic direction

**Scenario Loom is an editorial data-journalism broadsheet.** It reads like a chart lifted
from a print statistics feature — the kind of cream-paper, crimson-accented forecast cone
you'd see captioned "our model's 1,000 simulated outcomes" in a serious newspaper's data
desk. Warm ivory paper, hairline rules, a serif masthead, and one confident crimson accent
against ink-navy text and paths. It's calm and considered where a lot of data tools go
either sterile-clinical or neon-dashboard — the goal is "a statistician's Sunday feature,"
not "a terminal" or "a trading floor."

*(Chosen to sit apart from this portfolio's recent runs: Monotile and Molsnap already
claimed blueprint/cyanotype, Oneline claimed risograph, Epicycle claimed vapor-gradient,
Codon claimed paper-and-ink lab-notebook, and Statute Watch/Skillcheck claimed
swiss-grid/warm-blueprint. Editorial serif on warm paper is unclaimed territory.)*

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f4ede1` | page background — warm ivory paper |
| `--surface-1` | `#ece2d0` | card / panel surface (one step darker than bg) |
| `--surface-2` | `#e2d5bd` | recessed surface — slider tracks, input wells |
| `--ink` | `#241f1a` | primary text — warm near-black, not pure #000 |
| `--ink-muted` | `#6b6153` | secondary text, captions, axis labels |
| `--accent` | `#b3311f` | crimson — primary accent, the median path, CTAs |
| `--accent-support` | `#2b5a63` | deep teal — support accent, the outer percentile bands |
| `--success` | `#3f7a4e` | forest green — positive/valid states |
| `--danger` | `#b3311f` | shares the crimson accent — errors read as "attention," not a separate hue |

- **Type pairing:** `Fraunces` (display serif, variable, used for the wordmark and H1/H2)
  paired with `Inter` (UI sans, body copy, labels, numbers) — both from Google Fonts, with
  `Georgia, serif` / `system-ui, sans-serif` fallbacks respectively.
- **Type scale:** 1.25 ratio — 13 / 16 / 20 / 25 / 31 / 39 / 49px.
- **Spacing unit:** 8px scale (8/16/24/32/48/64).
- **Corner radius:** 4px on controls and inputs, 10px on panels — crisp, not pill-shaped;
  matches a printed card, not a soft app.
- **Shadow:** a single soft, low-contrast drop shadow (`0 2px 8px rgba(36,31,26,0.12)`) on
  raised panels — no glow, no neon; depth reads as "paper stacked on paper."
- **Motion:** UI transitions 150ms ease-out; slider-driven resimulation redraw completes
  in under a second end to end (the core performance requirement, not just a UI nicety).

## 3. Layout intent

The **fan chart is the hero**: a full-bleed canvas occupying ~65% of the viewport height on
desktop (1440×900), with the three sliders (mean, variance, correlation) plus the preset
row docked in a left-hand rail (~320px) that reads like a page margin with pull-quotes, not
a settings panel. A slim masthead strip runs the top: the wordmark, a one-line strapline,
and the mute/export controls.

At phone width (390×844) the rail collapses below the chart: chart first (full width,
~50vh), then the sliders stacked full-width beneath it, each with large touch-friendly
thumbs. No dead margin — the canvas always fills its available width edge-to-edge with a
16px paper gutter, never a small fixed-pixel box adrift in whitespace.

## 4. Signature detail

The masthead wordmark "Scenario Loom" animates on load: individual letters settle in with
a 40ms stagger and a subtle serif-weight overshoot, as if type were being set on a press —
then a thin crimson underline rule draws itself left-to-right beneath it (280ms ease-out).
This same underline-draw motion is reused as the "loading" tell whenever a resimulation is
in flight, tying the one flourish to the one thing the product actually does.

## 5. Juice plan (applies to the fan-chart interaction, not a game, but every drag needs feedback)

- **Slider drag → redraw:** paths and bands redraw within the same animation frame budget
  that keeps drag-to-visual latency under 100ms perceived, even mid-drag (debounced to the
  next animation frame, not on every mousemove tick).
- **Path sweep-in:** on a fresh simulation (not a live drag-scrub), paths draw with a brief
  60–100ms staggered fade-in per path so 2,000 lines don't just snap into existence.
- **Band pulse:** when variance or correlation crosses a slider's boundary handle release,
  the percentile band briefly pulses opacity (120ms) to confirm "this just recomputed."
- **Sound:** WebAudio-synthesized SFX — a soft, short filtered-noise "whoosh" on releasing
  a slider (confirms a resimulation fired), a light tick on preset switch, and a rising
  two-note chime if the user cranks path count to its max (a small reward beat). All
  subtle, rate-throttled to avoid clutter on rapid drags, with a persistent mute toggle
  (localStorage) and lazy `AudioContext` creation on first gesture.
- Respect `prefers-reduced-motion`: keep the redraw itself, drop the letter-stagger intro,
  fade-in stagger, and pulse animation.
