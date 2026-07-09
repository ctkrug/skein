import { theme } from "./theme";

/**
 * Builds the favicon as an inline SVG data URI — an ivory tile with a crimson
 * fan sweep and an ink "S" monogram, matching the masthead. Generated in code
 * (zero binary assets) so the brand mark lives in the same palette as the app
 * and there is never a default-globe stub.
 */
export function faviconDataUri(): string {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">`,
    `<rect width="32" height="32" rx="6" fill="${theme.bg}"/>`,
    // A widening fan cone in the support teal, echoing the chart.
    `<path d="M4 26 L28 10 L28 22 Z" fill="${theme.accentSupport}" opacity="0.35"/>`,
    // The crimson median stroke.
    `<path d="M4 26 L28 14" stroke="${theme.accent}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    `<text x="16" y="21" font-family="Georgia, serif" font-size="15" font-weight="700" fill="${theme.ink}" text-anchor="middle">S</text>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Injects (or updates) the favicon link in the document head. */
export function installFavicon(doc: Document = document): void {
  let link = doc.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = doc.createElement("link");
    link.rel = "icon";
    doc.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = faviconDataUri();
}
