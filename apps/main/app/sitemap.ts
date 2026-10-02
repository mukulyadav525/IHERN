import type { MetadataRoute } from "next";
import { absoluteUrl } from "@ihern/core/env";

// Built per request so the addresses follow IHERN_SITE_URL on the server.
export const dynamic = "force-dynamic";

/** The public pages (sitemap.xml on the PHP site, at their new addresses). */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ["", 1.0],
    ["about", 0.8],
    ["initiatives", 0.8],
    ["members", 0.7],
    ["stc", 0.7],
    ["sig", 0.7],
    ["reports", 0.6],
    ["blogs", 0.7],
    ["join", 0.6],
    ["iherc2026", 0.9],
    ["iherc2026/abstract", 0.6],
    ["iherc2026/registration", 0.6],
    ["iherc2025", 0.4],
  ];
  return pages.map(([path, priority]) => ({ url: absoluteUrl(path), priority }));
}
