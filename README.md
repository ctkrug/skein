# Scenario Loom

A domain-agnostic Monte Carlo sandbox in the browser. Set a mean, a variance, and a
correlation with three sliders and watch thousands of simulated paths sweep across the
screen live, tracing a fan chart that widens and narrows as you drag.

There's no dataset to load and no domain to pick. The same three sliders describe a
project timeline slipping, a batting average regressing, or a stock return distributing —
uncertainty is uncertainty, and Scenario Loom lets you feel its shape instead of reading it
off a table.

## Why

Most Monte Carlo tools are bolted onto a specific domain (a finance calculator, a project
risk tracker) and hide the simulation behind a report. Scenario Loom strips the simulation
down to its three real parameters and makes the *output itself* the interface: drag a
slider, watch the cone of outcomes respond in under a second, 2,000 paths at a time.

## The wow moment

Drag the variance slider. 2,000 simulated paths resweep the canvas in under a second, and
the fan chart's cone visibly widens or narrows live, in sync with your hand.

## Planned features

- Three core controls: mean (drift), variance (volatility), and correlation (how strongly
  each step depends on the last).
- A live fan chart: percentile bands (e.g. 5/25/50/75/95) rendered under thousands of raw
  sample paths, redrawn at interactive framerates as sliders move.
- A path-count control (drag from a few dozen paths up to several thousand) with the
  renderer staying smooth throughout.
- Presets that reframe the same three sliders for different domains (finance-flavored,
  project-timeline-flavored, sports-flavored) without changing the underlying math.
- Exportable snapshots (PNG of the current fan chart) and shareable parameter links.

## Stack

- **TypeScript** for the simulation core and UI logic.
- **D3** (`d3-selection`, `d3-scale`, `d3-shape`, `d3-array`) for scales, axes, and path
  generation; rendering itself targets `<canvas>` for the raw path volume, with D3 driving
  the fan-chart overlay.
- **Vite** for dev server + static production build.
- **Vitest** for unit tests of the simulation math (mean/variance/correlation must be
  statistically correct, not just fast).

See [`docs/VISION.md`](docs/VISION.md) for the full design rationale and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## Status

Early scaffold — see the backlog for what's built vs. planned.

## License

MIT — see [`LICENSE`](LICENSE).
