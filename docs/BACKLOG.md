# Backlog

Epic/story breakdown for the v1 build. Every story has 1–3 verifiable acceptance criteria
— concrete checks, not vibes. Build implements to the criteria; QA attacks them.

## Epic 1 — Live Fan Chart Core

The wow moment lives here: drag a slider, watch thousands of paths resweep the canvas as
the fan chart's cone visibly responds, in under a second.

- [ ] **1.1 — Drag a slider, watch 2,000 paths resweep the fan chart live (WOW MOMENT)**
  - [ ] Dragging the variance slider from its minimum to its maximum triggers a full
        resimulate-and-redraw cycle that completes in under 1000ms, measured end to end
        from the input event to the last path drawn.
  - [ ] With path count set to 2,000, the canvas renders all paths without the redraw
        cycle dropping below ~30fps during the drag.
  - [ ] The rendered percentile band visibly widens when variance increases and narrows
        when it decreases — verifiable by comparing the p95–p05 band pixel width before
        and after a variance change.

- [ ] **1.2 — Canvas renderer draws percentile bands under the raw paths**
  - [ ] Given a `PathSet`, `percentileBands()`'s 5/25/50/75/95 output renders as five
        stacked bands, ordered outer-to-inner, beneath the raw path strokes.
  - [ ] Bands use `--accent-support` for the outer band and `--accent` for the median
        line, per `docs/DESIGN.md` tokens.

- [ ] **1.3 — Path-count control scales from dozens to thousands without degrading framerate**
  - [ ] The path-count slider's documented range (e.g. 50–5000) redraws within the same
        sub-1000ms budget as story 1.1 at its maximum value.
  - [ ] The canvas renders at `devicePixelRatio` × CSS size and recomputes/redraws
        correctly on window resize.

- [ ] **1.4 — Design polish: style the sliders and fan-chart page to `docs/DESIGN.md`**
  - [ ] Sliders, buttons, and panels use themed (non-native-default) controls with hover,
        focus-visible, active, and disabled states per the design standard.
  - [ ] The layout matches `docs/DESIGN.md`'s hero-canvas composition at 1440×900 and
        390×844 with no horizontal scroll and no dead margins around the chart.

## Epic 2 — Domain Presets & Sharing

Prove the "not tied to any domain" claim: the same three sliders get reframed, shared, and
exported without the simulation ever branching on which domain is active.

- [ ] **2.1 — Preset row reframes the sliders for different domains**
  - [ ] Selecting a preset updates all three slider values and an axis-label/caption
        string; `simulate()` itself is called with the same signature regardless of which
        preset is active — no domain-specific branch in the sim core.
  - [ ] At least three presets exist (e.g. finance, project timeline, sports), each with
        distinct starting mean/variance/correlation values.

- [ ] **2.2 — Shareable parameter link**
  - [ ] Changing any slider updates the URL (query string or hash) without a full page
        reload.
  - [ ] Loading a URL with encoded parameters restores the same slider values and
        re-simulates on load.

- [ ] **2.3 — PNG export of the current fan chart**
  - [ ] Clicking "export" downloads a PNG containing the current canvas content.
  - [ ] The exported PNG's pixel dimensions match the on-screen canvas's rendered
        (devicePixelRatio-aware) size.

- [ ] **2.4 — Design polish: masthead wordmark animation + signature underline detail**
  - [ ] On initial load, the wordmark letters stagger in (~40ms stagger) and the crimson
        underline draws left-to-right once (~280ms), per `docs/DESIGN.md` section 4.
  - [ ] `prefers-reduced-motion` disables the stagger/draw intro while the page still
        renders all content correctly.

## Epic 3 — Feel, Sound & Correctness Hardening

Make the interaction feel good and make sure the math underneath is actually trustworthy,
not just fast.

- [ ] **3.1 — Synth SFX with a persistent mute toggle**
  - [ ] A mute toggle exists and its state persists across reloads via `localStorage`.
  - [ ] `AudioContext` is created lazily on first user gesture, and the app doesn't throw
        in environments without WebAudio (e.g. the test runner).

- [ ] **3.2 — Statistical correctness: verify correlation's effect, not just mean/variance**
  - [ ] A test computes lag-1 autocorrelation across simulated paths at multiple
        correlation settings and asserts it trends with the configured correlation
        parameter.
  - [ ] All existing `simulate()`/`percentileBands()` tests continue to pass
        (`npm test` green).

- [ ] **3.3 — Responsive & accessibility pass**
  - [ ] All sliders are operable via keyboard (arrow keys) with a visible focus-visible
        state.
  - [ ] Slider thumbs and buttons measure ≥ 44px at 390px viewport width.

- [ ] **3.4 — Design polish: brand assets and light/dark treatment**
  - [ ] A code-generated favicon (inline SVG data URI, accent + monogram) is wired into
        `index.html` — no default globe icon.
  - [ ] Either both a light and dark treatment exist, or `prefers-color-scheme` is honored
        well enough that a dark-preferring device isn't hit with a pure-white flash.
