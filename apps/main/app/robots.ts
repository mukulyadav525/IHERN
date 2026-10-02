import type { MetadataRoute } from "next";
import { absoluteUrl } from "@ihern/core/env";

// Built per request so the addresses follow IHERN_SITE_URL on the server.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/account", "/login", "/membership/"] },
    sitemap: absoluteUrl("sitemap.xml"),
  };
}
