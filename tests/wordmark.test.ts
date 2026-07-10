// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { buildWordmark, staggerDelays } from "../src/wordmark";

describe("staggerDelays", () => {
  it("spaces delays evenly by the step", () => {
    expect(staggerDelays(4, 40)).toEqual([0, 40, 80, 120]);
  });

  it("returns an empty schedule for zero or negative counts", () => {
    expect(staggerDelays(0)).toEqual([]);
    expect(staggerDelays(-3)).toEqual([]);
  });
});

describe("buildWordmark", () => {
  it("stages a settle-in animation per letter when motion is not reduced", () => {
    const h1 = buildWordmark("Hi", false);
    const letters = h1.querySelectorAll<HTMLElement>(".wordmark__letter");
    expect(letters).toHaveLength(2);
    expect(letters[0].classList.contains("wordmark__letter--intro")).toBe(true);
    expect(letters[1].style.animationDelay).toBe("40ms");
  });

  it("renders fully settled with no intro under reduced motion", () => {
    const h1 = buildWordmark("Hi", true);
    const letters = h1.querySelectorAll<HTMLElement>(".wordmark__letter");
    expect(letters[0].classList.contains("wordmark__letter--intro")).toBe(
      false,
    );
    expect(letters[0].style.opacity).toBe("1");
  });

  it("renders a space as its own non-breaking letter span", () => {
    // A plain space between per-letter spans is a valid line-break point,
    // which could split "Scenario Loom" across two lines mid-masthead; a
    // non-breaking space keeps the wordmark one visual unit.
    const h1 = buildWordmark("A B", false);
    const letters = h1.querySelectorAll<HTMLElement>(".wordmark__letter");
    expect(letters).toHaveLength(3);
    expect(letters[1].textContent?.charCodeAt(0)).toBe(160);
  });
});
