import { describe, expect, it } from "vitest";
import { staggerDelays } from "../src/wordmark";

describe("staggerDelays", () => {
  it("spaces delays evenly by the step", () => {
    expect(staggerDelays(4, 40)).toEqual([0, 40, 80, 120]);
  });

  it("returns an empty schedule for zero or negative counts", () => {
    expect(staggerDelays(0)).toEqual([]);
    expect(staggerDelays(-3)).toEqual([]);
  });
});
