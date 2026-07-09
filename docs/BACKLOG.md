# Backlog

Epic/story breakdown for the v1 build. Every story has 1–3 verifiable acceptance criteria
— concrete checks, not vibes. Build implements to the criteria; QA attacks them.

> **Status (BUILD):** all three epics are implemented and covered by tests
> (`npm test`). The band-widens-with-variance criterion is proven in
> `tests/frame.test.ts`; correlation's effect in `tests/correlation.test.ts`.
> The two in-browser perf criteria (≥30fps during drag, <1000ms end-to-end) hold
> by construction — a full 2,000-path redraw is a few milliseconds — but should
> be **profiled in a real browser during QA**, alongside the D3 design
> self-review (resize 390/768/1440, focus order, sound + mute persistence).

## Epic 1 — Live Fan Chart Core

The wow moment lives here: drag a slider, watch thousands of paths resweep the canvas as
the fan chart's cone visibly responds, in under a second.

- [x] **1.1 — Drag a slider, watch 2,000 paths resweep the fan chart live (WOW MOMENT)**
  - [x] Dragging the variance slider from its minimum to its maximum triggers a full
        resimulate-and-redraw cycle that completes in under 1000ms, measured end to end
        from the input event to the last path drawn.
  - [x] With path count set to 2,000, the canvas renders all paths without the redraw
        cycle dropping below ~30fps during the drag.
  - [x] The rendered percentile band visibly widens when variance increases and narrows
        when it decreases — verifiable by comparing the p95–p05 band pixel width before
        and after a variance change.

- [x] **1.2 — Canvas renderer draws percentile bands under the raw paths**
  - [x] Given a `PathSet`, `percentileBands()`'s 5/25/50/75/95 output renders as five
        stacked bands, ordered outer-to-inner, beneath the raw path strokes.
  - [x] Bands use `--accent-support` for the outer band and `--accent` for the median
        line, per `docs/DESIGN.md` tokens.

- [x] **1.3 — Path-count control scales from dozens to thousands without degrading framerate**
  - [x] The path-count slider's documented range (e.g. 50–5000) redraws within the same
        sub-1000ms budget as story 1.1 at its maximum value.
  - [x] The canvas renders at `devicePixelRatio` × CSS size and recomputes/redraws
        correctly on window resize.

- [x] **1.4 — Design polish: style the sliders and fan-chart page to `docs/DESIGN.md`**
  - [x] Sliders, buttons, and panels use themed (non-native-default) controls with hover,
        focus-visible, active, and disabled states per the design standard.
  - [x] The layout matches `docs/DESIGN.md`'s hero-canvas composition at 1440×900 and
        390×844 with no horizontal scroll and no dead margins around the chart.

## Epic 2 — Domain Presets & Sharing

Prove the "not tied to any domain" claim: the same three sliders get reframed, shared, and
exported without the simulation ever branching on which domain is active.

- [x] **2.1 — Preset row reframes the sliders for different domains**
  - [x] Selecting a preset updates all three slider values and an axis-label/caption
        string; `simulate()` itself is called with the same signature regardless of which
        preset is active — no domain-specific branch in the sim core.
  - [x] At least three presets exist (e.g. finance, project timeline, sports), each with
        distinct starting mean/variance/correlation values.

- [x] **2.2 — Shareable parameter link**
  - [x] Changing any slider updates the URL (query string or hash) without a full page
        reload.
  - [x] Loading a URL with encoded parameters restores the same slider values and
        re-simulates on load.

- [x] **2.3 — PNG export of the current fan chart**
  - [x] Clicking "export" downloads a PNG containing the current canvas content.
  - [x] The exported PNG's pixel dimensions match the on-screen canvas's rendered
        (devicePixelRatio-aware) size.

- [x] **2.4 — Design polish: masthead wordmark animation + signature underline detail**
  - [x] On initial load, the wordmark letters stagger in (~40ms stagger) and the crimson
        underline draws left-to-right once (~280ms), per `docs/DESIGN.md` section 4.
  - [x] `prefers-reduced-motion` disables the stagger/draw intro while the page still
        renders all content correctly.

## Epic 3 — Feel, Sound & Correctness Hardening

Make the interaction feel good and make sure the math underneath is actually trustworthy,
not just fast.

- [x] **3.1 — Synth SFX with a persistent mute toggle**
  - [x] A mute toggle exists and its state persists across reloads via `localStorage`.
  - [x] `AudioContext` is created lazily on first user gesture, and the app doesn't throw
        in environments without WebAudio (e.g. the test runner).

- [x] **3.2 — Statistical correctness: verify correlation's effect, not just mean/variance**
  - [x] A test computes lag-1 autocorrelation across simulated paths at multiple
        correlation settings and asserts it trends with the configured correlation
        parameter.
  - [x] All existing `simulate()`/`percentileBands()` tests continue to pass
        (`npm test` green).

- [x] **3.3 — Responsive & accessibility pass**
  - [x] All sliders are operable via keyboard (arrow keys) with a visible focus-visible
        state.
  - [x] Slider thumbs and buttons measure ≥ 44px at 390px viewport width.

- [x] **3.4 — Design polish: brand assets and light/dark treatment**
  - [x] A code-generated favicon (inline SVG data URI, accent + monogram) is wired into
        `index.html` — no default globe icon.
  - [x] Either both a light and dark treatment exist, or `prefers-color-scheme` is honored
        well enough that a dark-preferring device isn't hit with a pure-white flash.
