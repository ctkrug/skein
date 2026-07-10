// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { faviconDataUri, installFavicon } from "../src/favicon";
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

describe("installFavicon", () => {
  it("inserts a fresh icon link when the head has none", () => {
    document.head.innerHTML = "";
    installFavicon(document);
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    expect(link).not.toBeNull();
    expect(link!.type).toBe("image/svg+xml");
    expect(link!.href).toContain("data:image/svg+xml,");
  });

  it("updates an existing icon link in place rather than duplicating it", () => {
    document.head.innerHTML = '<link rel="icon" href="/old-favicon.ico">';
    installFavicon(document);
    const links = document.querySelectorAll('link[rel="icon"]');
    expect(links).toHaveLength(1);
    expect((links[0] as HTMLLinkElement).href).toContain("data:image/svg+xml,");
  });
});
