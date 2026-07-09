# Vision

## The problem

Monte Carlo simulation is the right tool any time an outcome is uncertain — a project
deadline, a batting average, a stock return, a startup's runway — but almost every tool
that runs one is locked to a single domain. A finance app frames it as "expected return
and volatility"; a project-management app frames it as "optimistic/pessimistic estimate."
The math underneath is identical (a mean, a variance, and how much each step depends on
the last), but you can't move that intuition between tools, and the simulation itself is
usually hidden behind a static report — a table of percentiles, maybe one chart, rendered
once and left there. You never get to *feel* the shape of the uncertainty change as the
inputs change.

## Who it's for

Anyone who has ever asked "how uncertain is this, really?" and wanted to poke at the
assumptions instead of trusting a single-number estimate: an engineer estimating a
project timeline, a fan arguing about regression to the mean, a hobbyist who wants to see
what "high variance" actually looks like instead of just hearing the phrase. It assumes
no statistics background beyond "higher variance means less certain" and "correlation
means today depends on yesterday."

## The core idea

Three sliders — **mean**, **variance**, **correlation** — drive a Monte Carlo engine that
sweeps thousands of simulated paths across a canvas in real time, with a fan chart (the
5/25/50/75/95 percentile bands) overlaid on the raw paths. Nothing about the sliders or
the renderer references a domain. A row of presets *reframes* the same three numbers
("optimistic PM," "streaky shooter," "volatile stock") purely as labels and starting
values — the simulation never branches on which preset is active.

Dragging any slider re-runs the simulation and redraws the full path set in well under a
second, so the input and the output feel like the same gesture: turn the volatility up,
watch the cone visibly widen, in real time, not after a "Run" button and a spinner.

## Key design decisions

- **AR(1)-style process, not domain models.** Each path step is
  `mean + correlation * (previous - mean) + noise`, where `noise ~ Normal(0, variance)`.
  This is expressive enough to cover independent draws (correlation = 0), mean-reverting
  swings (correlation > 0), and choppy oscillation (correlation < 0) with three plain
  numbers — no domain-specific parameters to add later.
- **Canvas for raw paths, D3 for scales/shapes/the fan overlay.** Thousands of individual
  path strokes need direct canvas drawing to hit 60fps; D3's scale and shape utilities
  compute the percentile-band geometry without fighting SVG's per-element DOM overhead at
  that path count.
- **The simulation core has zero DOM dependency.** `src/sim/` is pure TypeScript,
  independently unit-testable (seeded reproducibility, convergence to the configured
  mean, variance scaling the spread) without a browser — the renderer is a thin
  consumer, not where the correctness lives.
- **Static, relative-path build.** No backend, no API — the whole app is a static bundle
  so it can be hosted at a subpath (`apps.charliekrug.com/scenario-loom`) with zero
  infrastructure.
- **Presets are UI sugar, not branching logic.** A preset sets slider values and swaps
  labels/copy; it never changes how `simulate()` runs. This is what keeps the tool
  honestly domain-agnostic instead of secretly being a finance calculator wearing masks.

## What "v1 done" looks like

- The three sliders (mean, variance, correlation) drive a live re-simulation and redraw
  in under a second at 2,000+ paths, with the fan chart's cone visibly responding to
  variance and correlation changes — the wow moment, reachable with zero prior clicks.
- A path-count control scales from a few dozen paths up to several thousand without the
  frame rate visibly degrading.
- At least three presets reframe the sliders for different domains (e.g. finance,
  project timeline, sports) using only labels/starting values.
- The page matches `docs/DESIGN.md`'s direction: a designed, responsive UI at desktop and
  phone widths, not a bare slider row over a plain canvas.
- `npm run build` produces a self-contained static bundle deployable to a subpath with no
  server, and `npm test` covers the simulation core's statistical properties.
