// Renders docs/sample.svg: a static fan chart from the same AR(1) process the
// app runs live, in the docs/DESIGN.md palette. Mirrors the math in
// src/sim/simulate.ts so the marketing image is a real sample of the output,
// not a mock-up. Run with `npm run sample` after changing the look.
import { randomNormal, randomLcg } from "d3-random";
import { writeFileSync } from "node:fs";

const W = 960;
const H = 540;
const PAD = 24;

// AR(1): x[t] = mean + correlation * (x[t-1] - mean) + Normal(0, variance).
function simulate({ mean, variance, correlation, steps, paths, seed }) {
  const noise = randomNormal.source(randomLcg(seed))(0, Math.sqrt(variance));
  const out = [];
  for (let p = 0; p < paths; p++) {
    const path = new Float64Array(steps);
    path[0] = mean;
    for (let t = 1; t < steps; t++) {
      path[t] = mean + correlation * (path[t - 1] - mean) + noise();
    }
    out.push(path);
  }
  return out;
}

function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - pos) + sorted[hi] * (pos - lo);
}

function percentileBands(paths, qs) {
  const steps = paths[0].length;
  return qs.map((q) => {
    const row = new Float64Array(steps);
    for (let t = 0; t < steps; t++) {
      const col = Float64Array.from(paths, (p) => p[t]).sort();
      row[t] = quantile(col, q);
    }
    return row;
  });
}

const params = {
  mean: 100,
  variance: 160,
  correlation: 0.35,
  steps: 60,
  paths: 2000,
  seed: 7,
};
const paths = simulate(params);
const percentiles = [0.05, 0.25, 0.5, 0.75, 0.95];
const bands = percentileBands(paths, percentiles);

// Frame: cover every band value, padded so strokes never touch the edge.
let min = Infinity;
let max = -Infinity;
for (const row of bands)
  for (const v of row) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
const span = max - min || 1;
min -= span * 0.08;
max += span * 0.08;

const x = (t) => PAD + (t / (params.steps - 1)) * (W - 2 * PAD);
const y = (v) => H - PAD - ((v - min) / (max - min)) * (H - 2 * PAD);
const pts = (row, from, to, step) => {
  const p = [];
  for (let t = from; step > 0 ? t <= to : t >= to; t += step)
    p.push(`${x(t).toFixed(0)},${y(row[t]).toFixed(0)}`);
  return p.join(" ");
};

const last = params.steps - 1;
const bandFills = [];
for (let i = 0; i < 2; i++) {
  const lo = bands[i];
  const hi = bands[bands.length - 1 - i];
  const alpha = 0.14 + i * 0.16;
  bandFills.push(
    `<polygon points="${pts(hi, 0, last, 1)} ${pts(lo, last, 0, -1)}" ` +
      `fill="#2b5a63" fill-opacity="${alpha}"/>`,
  );
}

// A faint, evenly-strided subsample of raw paths, as in the app.
const threads = [];
const stride = Math.ceil(paths.length / 120);
for (let p = 0; p < paths.length; p += stride) {
  threads.push(
    `<polyline points="${pts(paths[p], 0, last, 1)}" fill="none" ` +
      `stroke="#241f1a" stroke-opacity="0.05" stroke-width="1"/>`,
  );
}

const median = `<polyline points="${pts(bands[2], 0, last, 1)}" fill="none" stroke="#b3311f" stroke-width="2.5" stroke-linejoin="round"/>`;

// Like the app's canvas (overflow:hidden), extreme raw paths clip at the edge.
const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Fan chart of 2,000 simulated Monte Carlo paths">`,
  `<clipPath id="frame"><rect width="${W}" height="${H}"/></clipPath>`,
  `<rect width="${W}" height="${H}" fill="#f4ede1"/>`,
  `<g clip-path="url(#frame)">`,
  ...bandFills,
  ...threads,
  median,
  `</g>`,
  `<text x="${PAD}" y="${PAD + 4}" font-family="Georgia, serif" font-size="15" fill="#6b6153">Price · 2,000 paths · 60 trading days</text>`,
  `</svg>`,
].join("\n");

writeFileSync(new URL("../docs/sample.svg", import.meta.url), svg + "\n");
console.log("wrote docs/sample.svg");
