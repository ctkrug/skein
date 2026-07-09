import { describe, expect, it } from "vitest";
import { faviconDataUri } from "../src/favicon";
import { theme } from "../src/theme";

describe("faviconDataUri", () => {
  it("is a self-contained SVG data URI", () => {
    const uri = faviconDataUri();
    expect(uri.startsWith("data:image/svg+xml,")).toBe(true);
    expect(decodeURIComponent(uri)).toContain("<svg");
  });

  it("uses the brand accent so it is never a default globe", () => {
    expect(decodeURIComponent(faviconDataUri())).toContain(theme.accent);
  });

  it("carries the S monogram", () => {
    expect(decodeURIComponent(faviconDataUri())).toContain(">S<");
  });
});
