import { simulate } from "./sim/simulate";

/**
 * Scaffold entrypoint: proves the simulation core, the canvas, and the
 * build pipeline are wired together end to end. The real fan-chart
 * renderer (docs/BACKLOG.md epic 1) replaces this draw call.
 */
function main(): void {
  const app = document.getElementById("app");
  if (!app) return;

  const heading = document.createElement("h1");
  heading.textContent = "Scenario Loom";
  const sub = document.createElement("p");
  sub.textContent = "Monte Carlo sandbox — scaffold running.";

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const paths = simulate({
      mean: 120,
      variance: 25,
      correlation: 0.6,
      steps: 80,
      paths: 40,
      seed: 2026,
    });

    ctx.strokeStyle = "rgba(122, 162, 247, 0.5)";
    ctx.lineWidth = 1;
    const xStep = canvas.width / (paths[0].length - 1);
    const yMid = canvas.height / 2;
    for (const path of paths) {
      ctx.beginPath();
      path.forEach((value, t) => {
        const x = t * xStep;
        const y = yMid - (value - 120) * 3;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }

  app.append(heading, sub, canvas);
}

main();
