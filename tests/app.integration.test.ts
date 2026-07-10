// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/app";

/**
 * Integration coverage for the DOM wiring: mounts the real App in jsdom with a
 * no-op canvas context so the controller, sliders, presets, URL sync and export
 * are exercised end to end (layout has zero size in jsdom, so pixels are not
 * asserted — behaviour is).
 */
function stubEnvironment(): void {
  const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as never;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
    cb(new Blob(["x"], { type: "image/png" }));
  } as never;
  window.matchMedia = vi.fn().mockReturnValue({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as never;
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
}

function mount(): App {
  document.body.innerHTML = '<div id="app"></div>';
  location.hash = "";
  return new App(document.getElementById("app")!);
}

beforeEach(() => {
  stubEnvironment();
});

describe("App layout", () => {
  it("renders the masthead wordmark with a letter per character", () => {
    mount();
    const letters = document.querySelectorAll(".wordmark__letter");
    expect(letters.length).toBe("Scenario Loom".length);
  });

  it("builds all four sliders and four preset buttons", () => {
    mount();
    expect(document.querySelectorAll(".control__input").length).toBe(4);
    expect(document.querySelectorAll(".preset").length).toBe(4);
    expect(document.querySelectorAll(".readout__cell").length).toBe(3);
  });
});

describe("App interaction", () => {
  it("updates the slider readout and URL hash on input", () => {
    mount();
    const mean = document.querySelector<HTMLInputElement>("#slider-mean")!;
    mean.value = "150";
    mean.dispatchEvent(new Event("input"));
    const output = document.querySelector<HTMLElement>(".control__value")!;
    expect(output.textContent).toBe("150");
    expect(location.hash).toContain("m=150");
  });

  it("lights the default preset on a fresh load", () => {
    mount();
    const stock = [
      ...document.querySelectorAll<HTMLButtonElement>(".preset"),
    ].find((b) => b.textContent === "Volatile stock")!;
    expect(stock.classList.contains("preset--active")).toBe(true);
  });

  it("marks a preset active and applies its values when clicked", () => {
    mount();
    const streak = [
      ...document.querySelectorAll<HTMLButtonElement>(".preset"),
    ].find((b) => b.textContent === "Streaky shooter")!;
    streak.click();
    expect(streak.classList.contains("preset--active")).toBe(true);
    const corr = document.querySelector<HTMLInputElement>(
      "#slider-correlation",
    )!;
    expect(Number(corr.value)).toBe(-0.4);
  });

  it("deactivates the preset once a slider is moved", () => {
    mount();
    const stock = [
      ...document.querySelectorAll<HTMLButtonElement>(".preset"),
    ].find((b) => b.textContent === "Volatile stock")!;
    stock.click();
    expect(stock.classList.contains("preset--active")).toBe(true);
    const variance =
      document.querySelector<HTMLInputElement>("#slider-variance")!;
    variance.value = "300";
    variance.dispatchEvent(new Event("input"));
    expect(stock.classList.contains("preset--active")).toBe(false);
  });

  it("exports a PNG without throwing", () => {
    mount();
    const exportBtn = [
      ...document.querySelectorAll<HTMLButtonElement>(".btn"),
    ].find((b) => b.textContent === "Export PNG")!;
    expect(() => exportBtn.click()).not.toThrow();
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("flashes an export-failed message when the canvas yields no blob", () => {
    mount();
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
      cb(null);
    } as never;
    const exportBtn = [
      ...document.querySelectorAll<HTMLButtonElement>(".btn"),
    ].find((b) => b.textContent === "Export PNG")!;
    exportBtn.click();
    expect(document.querySelector(".status")!.textContent).toBe(
      "Export failed",
    );
  });

  it("toggles the mute button's label and aria state on click", () => {
    localStorage.clear();
    mount();
    const muteBtn = document.querySelector<HTMLButtonElement>(".btn")!;
    expect(muteBtn.textContent).toBe("Sound on");
    muteBtn.click();
    expect(muteBtn.getAttribute("aria-pressed")).toBe("false");
    expect(muteBtn.getAttribute("aria-label")).toBe("Unmute sound effects");
    muteBtn.click();
    expect(muteBtn.getAttribute("aria-pressed")).toBe("true");
    expect(muteBtn.getAttribute("aria-label")).toBe("Mute sound effects");
  });

  it("clears a flash message after its timeout", () => {
    vi.useFakeTimers();
    try {
      mount();
      const exportBtn = [
        ...document.querySelectorAll<HTMLButtonElement>(".btn"),
      ].find((b) => b.textContent === "Export PNG")!;
      exportBtn.click();
      expect(document.querySelector(".status")!.textContent).toBe(
        "Exported PNG",
      );
      vi.advanceTimersByTime(2400);
      expect(document.querySelector(".status")!.textContent).toBe("");
    } finally {
      vi.useRealTimers();
    }
  });

  it("restores state from a URL hash on load", () => {
    document.body.innerHTML = '<div id="app"></div>';
    location.hash = "#m=42&v=250&c=-0.3&n=1500&p=streak";
    new App(document.getElementById("app")!);
    expect(
      document.querySelector<HTMLInputElement>("#slider-mean")!.value,
    ).toBe("42");
    expect(
      document.querySelector<HTMLInputElement>("#slider-paths")!.value,
    ).toBe("1500");
  });

  it("does not light a preset whose values were customized in the hash", () => {
    // Stock's canonical mean is 100; this shared hash carries a custom 150 while
    // still naming the stock preset (for its axis framing). The button must not
    // read as active, or a shared custom link looks like an unedited preset.
    document.body.innerHTML = '<div id="app"></div>';
    location.hash = "#m=150&v=160&c=0.35&n=2000&p=stock";
    new App(document.getElementById("app")!);
    const stock = [
      ...document.querySelectorAll<HTMLButtonElement>(".preset"),
    ].find((b) => b.textContent === "Volatile stock")!;
    expect(stock.classList.contains("preset--active")).toBe(false);
  });

  it("lights the preset when the hash values match it exactly", () => {
    document.body.innerHTML = '<div id="app"></div>';
    location.hash = "#m=100&v=160&c=0.35&n=2000&p=stock";
    new App(document.getElementById("app")!);
    const stock = [
      ...document.querySelectorAll<HTMLButtonElement>(".preset"),
    ].find((b) => b.textContent === "Volatile stock")!;
    expect(stock.classList.contains("preset--active")).toBe(true);
  });
});
