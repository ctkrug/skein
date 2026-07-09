# Architecture

A concise map of the codebase for anyone picking it up mid-stream.

## What it is

Scenario Loom is a static, single-page TypeScript app: three sliders (mean,
variance, correlation) plus a path-count control drive an AR(1) Monte Carlo
engine, and a canvas fan chart of the simulated paths redraws live on every
gesture. No backend, no persistence beyond a shareable URL hash and a muted-
sound preference in `localStorage`.

## Data flow

```
slider / preset gesture
      │
      ▼
App (src/app.ts) ── mutates ScenarioParams
      │
      ├─► simulate(toSimParams(state))        → PathSet          (src/sim/simulate.ts)
      ├─► percentileBands(paths, PERCENTILES)  → BandSet
      ├─► currentDomain()  frameHalfHeight/…   → stable Domain    (src/render/scales.ts)
      └─► FanChart.render(paths, bands, {domain, reveal})         (src/render/fanchart.ts)
                     │
                     ▼
              <canvas> (DPR-aware)
```

The simulation core has **zero DOM dependency** and never branches on domain —
presets only reframe labels and starting values.

## Modules

### Simulation (pure, DOM-free)

- `src/sim/simulate.ts` — `simulate()` (AR(1): `x[t] = mean + corr·(x[t-1] −
mean) + N(0, variance)`) and `percentileBands()`. The correctness lives here.

### Rendering

- `src/render/scales.ts` — pure value→pixel math: `domainOf`, `xMap`, `yMap`,
  and the **stable framing** helpers `frameHalfHeight` / `outerDeviation` /
  `centeredDomain` that keep the cone responsive to variance instead of the view
  rescaling to hug the data.
- `src/render/fanchart.ts` — `FanChart` class: DPR-aware canvas sizing, nested
  percentile-band fills, faint raw-path strokes (density-scaled alpha), the
  crimson median line, and a left-to-right `reveal` for the sweep animation.
- `src/theme.ts` — palette tokens mirrored from `docs/DESIGN.md` for canvas
  drawing (which sits outside the CSS cascade), plus `withAlpha`.

### App shell (DOM)

- `src/app.ts` — the `App` controller: builds the editorial layout, owns the
  scenario, and turns every gesture into a resimulate-and-redraw. Drag = instant
  full redraw (live cone); preset/reseed/first-load = animated sweep.
- `src/main.ts` — boot: installs the favicon and mounts `App` into `#app`.
- `src/params.ts` — `ScenarioParams`, `SLIDERS` specs, clamping, `toSimParams`.
- `src/presets.ts` — domain framings (labels + starting values only).
- `src/url.ts` — encode/decode scenario ↔ location hash (clamped, junk-safe).
- `src/audio.ts` — `Synth`: WebAudio SFX (blip/sweep/chime), lazy context,
  persistent mute; inert (never throws) where WebAudio is absent.
- `src/format.ts` — value/signed formatters + export filename slug.
- `src/wordmark.ts` — per-letter masthead with staggered intro.
- `src/favicon.ts` — code-generated SVG-data-URI favicon.
- `src/dom.ts` — `el()` factory, reduced-motion probe, `easeOutCubic`.
- `src/style.css` — the editorial broadsheet styling (tokens, layout, themed
  controls, responsive + reduced-motion passes).

## Run / test / build

- `npm run dev` — Vite dev server.
- `npm test` — Vitest. Pure-logic suites run in Node; `tests/app.integration.
test.ts` runs under happy-dom (Node 18 breaks jsdom's deps here).
- `npm run build` — `tsc --noEmit && vite build` → `dist/` (static,
  `base: "./"` so it serves from a subpath like `/scenario-loom/`).
- `npm run lint` / `npm run format:check` — ESLint + Prettier (CI gates).

## Key decisions

- **Stable y-frame, not auto-fit.** Auto-fitting the domain each frame would
  make variance changes invisible (the cone and the axis scale together). The
  frame is centered on the mean and sized to the max-variance spread, so the
  band fills a `~√(variance/maxVariance)` fraction of a steady view.
- **Canvas for paths, pure TS for math.** Thousands of strokes need direct
  canvas drawing; the scales/bands stay pure and unit-tested.
- **Everything relative-path.** Static bundle, subpath-safe, backend-free.
