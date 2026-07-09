import { simulate, percentileBands, type PathSet } from "./sim/simulate";
import { FanChart, type BandSet } from "./render/fanchart";
import {
  SLIDERS,
  clampSlider,
  toSimParams,
  type ScenarioParams,
  type SliderSpec,
} from "./params";
import { PRESETS, presetById, DEFAULT_PRESET_ID, type Preset } from "./presets";
import { encodeState, decodeState } from "./url";
import { Synth } from "./audio";
import { formatValue, formatSigned, exportFilename } from "./format";
import { buildWordmark } from "./wordmark";
import { el, prefersReducedMotion, easeOutCubic } from "./dom";

/** The five fan-chart percentiles, outer to inner. */
const PERCENTILES = [0.05, 0.25, 0.5, 0.75, 0.95];
const SWEEP_MS = 650;

interface SliderControl {
  spec: SliderSpec;
  input: HTMLInputElement;
  value: HTMLElement;
}

/**
 * The whole interactive app: builds the editorial layout, owns the current
 * scenario, and turns every slider/preset gesture into a resimulate-and-redraw.
 * A drag redraws the full frame instantly (the live cone); presets, reseeds and
 * first load play the left-to-right sweep reveal.
 */
export class App {
  private readonly chart: FanChart;
  private readonly canvas: HTMLCanvasElement;
  private readonly synth = new Synth();
  private readonly reduced = prefersReducedMotion();

  private state: ScenarioParams;
  private framing: Preset;
  private activePresetId: string | null;

  private paths: PathSet = [];
  private bands: BandSet = { percentiles: PERCENTILES, rows: [] };

  private readonly sliders = new Map<SliderSpec["key"], SliderControl>();
  private readonly presetButtons = new Map<string, HTMLButtonElement>();
  private caption!: HTMLElement;
  private status!: HTMLElement;
  private readout!: {
    median: HTMLElement;
    range: HTMLElement;
    memory: HTMLElement;
  };
  private muteBtn!: HTMLButtonElement;
  private frame!: HTMLElement;
  private sweepRaf = 0;

  constructor(root: HTMLElement) {
    const decoded = decodeState(location.hash);
    this.state = decoded.params;
    this.framing =
      presetById(decoded.presetId ?? "") ?? presetById(DEFAULT_PRESET_ID)!;
    // If the hash carried an explicit preset with no custom edits, keep it lit.
    this.activePresetId =
      decoded.presetId && presetById(decoded.presetId)
        ? decoded.presetId
        : null;
    if (!location.hash) this.applyPresetValues(this.framing);

    this.canvas = el("canvas", { class: "chart__canvas" });
    this.canvas.setAttribute("role", "img");
    this.canvas.setAttribute(
      "aria-label",
      "Fan chart of simulated Monte Carlo paths",
    );
    this.chart = new FanChart(this.canvas);

    root.appendChild(this.buildLayout());
    this.syncInputs();
    this.observeResize();
    this.resimulate();
    this.measureAndDraw(!this.reduced);
    this.updateCopy();
    this.syncUrl();
  }

  // ---- layout ---------------------------------------------------------------

  private buildLayout(): HTMLElement {
    const app = el("div", { class: "app" });
    app.append(this.buildMasthead(), this.buildStage());
    return app;
  }

  private buildMasthead(): HTMLElement {
    const head = el("header", { class: "masthead" });

    const brand = el("div", { class: "masthead__brand" });
    brand.appendChild(buildWordmark("Scenario Loom", this.reduced));
    brand.appendChild(
      el("p", {
        class: "strapline",
        text: "Three sliders. A thousand futures, drawn live.",
      }),
    );

    const actions = el("div", { class: "masthead__actions" });
    this.status = el("span", {
      class: "status",
      attrs: { role: "status", "aria-live": "polite" },
    });
    this.muteBtn = el("button", {
      class: "btn btn--ghost",
      attrs: { type: "button" },
    });
    this.muteBtn.addEventListener("click", () => this.toggleMute());
    this.updateMuteLabel();

    const exportBtn = el("button", {
      class: "btn btn--ghost",
      text: "Export PNG",
      attrs: {
        type: "button",
        "aria-label": "Export the chart as a PNG image",
      },
    });
    exportBtn.addEventListener("click", () => this.exportPng());

    actions.append(this.status, this.muteBtn, exportBtn);
    head.append(brand, actions);
    return head;
  }

  private buildStage(): HTMLElement {
    const stage = el("main", { class: "stage" });

    const panel = el("section", { class: "chart-panel" });
    this.frame = el("div", { class: "chart" });
    this.frame.appendChild(this.canvas);
    this.frame.appendChild(this.buildAxis());
    this.caption = el("p", {
      class: "caption",
      attrs: { "aria-live": "polite" },
    });
    panel.append(this.frame, this.caption);

    stage.append(panel, this.buildRail());
    return stage;
  }

  private buildAxis(): HTMLElement {
    const axis = el("div", {
      class: "chart__axis",
      attrs: { "aria-hidden": "true" },
    });
    this.axisUnit = el("span", { class: "chart__axis-unit" });
    axis.appendChild(this.axisUnit);
    return axis;
  }
  private axisUnit!: HTMLElement;

  private buildRail(): HTMLElement {
    const rail = el("aside", { class: "rail" });

    const presets = el("div", {
      class: "presets",
      attrs: { role: "group", "aria-label": "Domain presets" },
    });
    presets.appendChild(el("h2", { class: "rail__title", text: "Reframe as" }));
    const row = el("div", { class: "presets__row" });
    for (const preset of PRESETS) {
      const btn = el("button", {
        class: "preset",
        text: preset.name,
        attrs: { type: "button" },
      });
      btn.addEventListener("click", () => this.selectPreset(preset.id));
      this.presetButtons.set(preset.id, btn);
      row.appendChild(btn);
    }
    presets.appendChild(row);

    const controls = el("div", { class: "controls" });
    for (const spec of SLIDERS) controls.appendChild(this.buildSlider(spec));

    const actions = el("div", { class: "rail__actions" });
    const reseed = el("button", {
      class: "btn btn--solid",
      text: "Reseed paths",
      attrs: { type: "button" },
    });
    reseed.addEventListener("click", () => this.reseed());
    actions.appendChild(reseed);

    rail.append(presets, controls, this.buildReadout(), actions);
    return rail;
  }

  private buildSlider(spec: SliderSpec): HTMLElement {
    const wrap = el("div", { class: "control" });
    const head = el("div", { class: "control__head" });
    const id = `slider-${spec.key}`;
    const label = el("label", {
      class: "control__label",
      text: spec.label,
      attrs: { for: id },
    });
    const value = el("output", { class: "control__value", attrs: { for: id } });
    head.append(label, value);

    const input = el("input", {
      class: "control__input",
      attrs: {
        id,
        type: "range",
        min: String(spec.min),
        max: String(spec.max),
        step: String(spec.step),
        "aria-label": spec.label,
      },
    });
    input.addEventListener("input", () =>
      this.onSlider(spec, Number(input.value)),
    );
    input.addEventListener("pointerdown", () => this.synth.resume());

    wrap.append(head, input);
    this.sliders.set(spec.key, { spec, input, value });
    return wrap;
  }

  private buildReadout(): HTMLElement {
    const box = el("div", { class: "readout" });
    const make = (label: string) => {
      const cell = el("div", { class: "readout__cell" });
      cell.appendChild(el("span", { class: "readout__label", text: label }));
      const v = el("strong", { class: "readout__value" });
      cell.appendChild(v);
      box.appendChild(cell);
      return v;
    };
    this.readout = {
      median: make("Median outcome"),
      range: make("90% range"),
      memory: make("Step-to-step"),
    };
    return box;
  }

  // ---- state → simulation ---------------------------------------------------

  private onSlider(spec: SliderSpec, raw: number): void {
    const current = this.state[spec.key];
    this.state[spec.key] = clampSlider(spec, raw, current);
    this.activePresetId = null;
    this.refreshPresetButtons();
    this.resimulate();
    this.measureAndDraw(false);
    this.synth.blip();
    this.updateReadout();
    this.updateSliderValue(spec.key);
    this.syncUrl();
  }

  private selectPreset(id: string): void {
    const preset = presetById(id);
    if (!preset) return;
    this.framing = preset;
    this.activePresetId = id;
    this.applyPresetValues(preset);
    this.syncInputs();
    this.refreshPresetButtons();
    this.resimulate();
    this.measureAndDraw(true);
    this.synth.sweep();
    this.updateCopy();
    this.syncUrl();
  }

  private applyPresetValues(preset: Preset): void {
    this.state.mean = preset.values.mean;
    this.state.variance = preset.values.variance;
    this.state.correlation = preset.values.correlation;
  }

  private reseed(): void {
    this.state.seed = (this.state.seed % 100000) + 1;
    this.resimulate();
    this.measureAndDraw(true);
    this.synth.sweep();
    this.updateReadout();
  }

  private resimulate(): void {
    this.paths = simulate(toSimParams(this.state));
    this.bands = {
      percentiles: PERCENTILES,
      rows: percentileBands(this.paths, PERCENTILES),
    };
  }

  // ---- rendering ------------------------------------------------------------

  private observeResize(): void {
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", () => this.measureAndDraw(false));
      return;
    }
    new ResizeObserver(() => this.measureAndDraw(false)).observe(this.frame);
  }

  private measureAndDraw(sweep: boolean): void {
    const w = this.frame.clientWidth;
    const h = this.frame.clientHeight;
    if (w > 0 && h > 0) this.chart.resize(w, h);
    if (sweep && !this.reduced) this.animateSweep();
    else this.drawFull();
  }

  private drawFull(): void {
    cancelAnimationFrame(this.sweepRaf);
    this.sweepRaf = 0;
    this.chart.render(this.paths, this.bands);
    this.updateReadout();
  }

  private animateSweep(): void {
    cancelAnimationFrame(this.sweepRaf);
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / SWEEP_MS);
      this.chart.render(this.paths, this.bands, { reveal: easeOutCubic(t) });
      if (t < 1) this.sweepRaf = requestAnimationFrame(step);
      else this.sweepRaf = 0;
    };
    this.sweepRaf = requestAnimationFrame(step);
    this.updateReadout();
  }

  // ---- copy + readouts ------------------------------------------------------

  private endpoint(rowIndex: number): number {
    const row = this.bands.rows[rowIndex];
    return row && row.length ? row[row.length - 1] : NaN;
  }

  private updateReadout(): void {
    const p50 = this.endpoint(2);
    const p05 = this.endpoint(0);
    const p95 = this.endpoint(4);
    this.readout.median.textContent = `${formatValue(p50)} ${this.framing.unit.toLowerCase()}`;
    this.readout.range.textContent = `${formatValue(p05)} – ${formatValue(p95)}`;
    this.readout.memory.textContent = correlationWord(this.state.correlation);
  }

  private updateCopy(): void {
    this.caption.textContent = this.framing.caption;
    this.axisUnit.textContent = `${this.framing.unit} · ${this.framing.stepLabel} 1–60`;
    this.updateReadout();
  }

  private updateSliderValue(key: SliderSpec["key"]): void {
    const control = this.sliders.get(key);
    if (!control) return;
    const v = this.state[key];
    control.value.textContent =
      key === "correlation" ? formatSigned(v) : String(Math.round(v));
  }

  private syncInputs(): void {
    for (const [key, control] of this.sliders) {
      control.input.value = String(this.state[key]);
      this.updateSliderValue(key);
    }
  }

  private refreshPresetButtons(): void {
    for (const [id, btn] of this.presetButtons) {
      const active = id === this.activePresetId;
      btn.classList.toggle("preset--active", active);
      btn.setAttribute("aria-pressed", String(active));
    }
  }

  // ---- audio + export -------------------------------------------------------

  private toggleMute(): void {
    this.synth.toggleMute();
    this.updateMuteLabel();
  }

  private updateMuteLabel(): void {
    const muted = this.synth.isMuted;
    this.muteBtn.textContent = muted ? "Sound off" : "Sound on";
    this.muteBtn.setAttribute("aria-pressed", String(!muted));
    this.muteBtn.setAttribute(
      "aria-label",
      muted ? "Unmute sound effects" : "Mute sound effects",
    );
  }

  private exportPng(): void {
    this.canvas.toBlob((blob) => {
      if (!blob) {
        this.flash("Export failed");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = el("a", {
        attrs: { href: url, download: exportFilename(this.framing.name) },
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.synth.chime();
      this.flash("Exported PNG");
    }, "image/png");
  }

  private flash(message: string): void {
    this.status.textContent = message;
    window.setTimeout(() => {
      if (this.status.textContent === message) this.status.textContent = "";
    }, 2400);
  }

  private syncUrl(): void {
    const hash = encodeState(this.state, this.framing.id);
    history.replaceState(null, "", hash);
  }
}

/** Plain-language description of what the correlation setting does. */
function correlationWord(c: number): string {
  if (c >= 0.6) return "strong momentum";
  if (c >= 0.2) return "mild pull";
  if (c > -0.2) return "near-memoryless";
  if (c > -0.6) return "choppy reversal";
  return "hard oscillation";
}

export { correlationWord };
