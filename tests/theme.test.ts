import { describe, expect, it } from "vitest";
import { theme, withAlpha } from "../src/theme";

describe("withAlpha", () => {
  it("converts a hex token to rgba at the given alpha", () => {
    expect(withAlpha("#b3311f", 0.5)).toBe("rgba(179, 49, 31, 0.5)");
  });

  it("tolerates a hex string without the leading hash", () => {
    expect(withAlpha("2b5a63", 1)).toBe("rgba(43, 90, 99, 1)");
  });

  it("round-trips the ink token", () => {
    expect(withAlpha(theme.ink, 0.12)).toBe("rgba(36, 31, 26, 0.12)");
  });
});
