---
title: "Building Skein: a live Monte Carlo fan chart, and two bugs that only show up at scale"
published: false
tags: typescript, dataviz, canvas, webdev
---

I built [Skein](https://apps.charliekrug.com/scenario-loom/), a browser Monte Carlo
sandbox. You drag three sliders (mean, variance, correlation), and it simulates a few
thousand paths and draws them as a fan chart, live, in under a second. No account, no data
upload, no domain baked in. The whole thing is TypeScript on a `<canvas>`, and the only
dependency that survived to release is `d3-random` for the seeded noise.

The idea was simple. The two most interesting problems were both cases where the naive
version works fine in a demo and falls apart at real numbers.

## Bug 1: the chart that goes black

The raw paths are the texture of the piece. You draw each simulated path as a faint line,
and where many of them overlap you get a darker region, so the density itself reads as the
spread. Draw 80 paths at 20% opacity and it looks great.

Draw 2,000 and the middle of the chart is solid black.

The reason is just how alpha compositing stacks. Each stroke multiplies the remaining
transparency, so `N` overlapping lines at opacity `a` leave `(1 - a)^N` of the background
showing. At `a = 0.05`, twenty overlapping lines already cover 64% of the way to opaque,
and near the median hundreds of near-identical Gaussian paths land in the same pixels. No
per-stroke opacity is low enough to survive that. If you turn it down far enough to not
saturate at 2,000 paths, it vanishes at 200.

The fix is to stop drawing every path. `sampleForDrawing()` takes an evenly-strided
subsample capped at 200 lines, and `densityAlpha()` is tuned against that fixed count
instead of the true path count. The percentile bands underneath carry the real statistics
across all 2,000 paths; the strokes are only there for texture, so a representative sample
is honest. The chart stays legible from 50 paths to 5,000, and the median line stops
disappearing under an ink blot.

## Bug 2: variance that does nothing

The point of the tool is that dragging variance visibly opens and closes the cone. My first
version auto-fit the vertical axis to the data every frame, the way most charts do.

That quietly cancels the entire effect. When you raise variance, the paths spread wider,
but the axis rescales to fit them, so the cone occupies the same fraction of the screen and
looks identical. The one interaction the tool exists for produced no visible change.

The fix is a deliberately stable frame. Instead of hugging the data, the view is centered
on the mean and sized to the spread the process would reach at maximum variance. Because
the outer band's deviation grows roughly like the square root of variance, scaling it by
`sqrt(maxVariance / variance)` gives a frame height that is nearly constant across the
slider. So a low-variance run fills a small fraction of a steady frame and a high-variance
run fills most of it, and dragging the slider does exactly what your hand expects. That
math lives in `frameHalfHeight()` and is unit-tested on its own, away from any canvas.

## What I would do differently

I reached for D3 out of habit and ended up deleting almost all of it. Percentile geometry,
the value-to-pixel scales, the fan fills: all of it turned out to be a dozen lines of plain
TypeScript that are easier to test than to wire through a charting API. Keeping the
simulation core free of the DOM meant the statistical properties (seeded reproducibility,
correlation showing up as lag-1 autocorrelation, bands staying monotonic) get property
tests with `fast-check`, no browser required.

The code is MIT and on [GitHub](https://github.com/ctkrug/scenario-loom). If you try it,
tell me whether the variance sweep feels the way it should. That is the whole product in one
gesture, and I want to know if it lands.
