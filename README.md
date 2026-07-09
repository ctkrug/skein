# Scenario Loom

[![CI](https://github.com/ctkrug/scenario-loom/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/scenario-loom/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

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
down to its three real parameters and makes the _output itself_ the interface: drag a
slider, watch the cone of outcomes respond in under a second, 2,000 paths at a time.

## The wow moment

Drag the variance slider. 2,000 simulated paths resweep the canvas in under a second, and
the fan chart's cone visibly widens or narrows live, in sync with your hand.

## Features

- Three core controls — mean (drift), variance (volatility), and correlation (how strongly
  each step depends on the last) — plus a path-count slider from 50 to 5,000 paths.
- A live fan chart: 5/25/50/75/95 percentile bands rendered under the raw sample paths on a
  DPR-aware canvas, redrawn on every slider gesture. The y-frame stays steady so the cone
  visibly opens and closes with variance instead of rescaling away.
- Domain presets (volatile stock, slipping timeline, streaky shooter, coin-flip baseline)
  that reframe the same three sliders with labels and starting values — the simulation never
  branches on which one is active.
- A shareable link (the scenario is encoded in the URL hash) and one-click PNG export of the
  current chart.
- Synth sound effects (WebAudio, no audio files) with a mute toggle that persists, a
  staggered masthead wordmark, and a full `prefers-reduced-motion` pass.

## Using it

```bash
npm install
npm run dev      # local dev server
npm test         # simulation + framing + DOM-wiring tests
npm run build    # static bundle in dist/ (serves from any subpath)
```

Drag any slider and the cone resweeps live. Pick a preset to reframe the numbers for a
different domain, tune from there, then share the URL or export a PNG.

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

Core is functionally complete: the live fan chart, presets, sharing, export, and sound all
work end to end. See [`docs/BACKLOG.md`](docs/BACKLOG.md) for remaining polish and
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the module map.

## License

MIT — see [`LICENSE`](LICENSE).
