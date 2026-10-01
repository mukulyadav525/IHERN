import type { MetadataRoute } from "next";
import { blogUrl } from "@ihern/core/env";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }, sitemap: `${blogUrl()}/sitemap.xml` };
}
