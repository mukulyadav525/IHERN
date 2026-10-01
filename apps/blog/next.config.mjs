/** @type {import('next').NextConfig} */

// Serve the blog from a sub-path instead of its domain root (rarely needed).
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");

const nextConfig = {
  reactStrictMode: true,
  basePath: basePath || undefined,
  // The shared package (packages/core) is TypeScript source.
  transpilePackages: ["@ihern/core"],
  // The middleware runs where only build-time values are visible: it needs
  // the main site's address to recognise readers arriving from there.
  env: { IHERN_SITE_URL: process.env.IHERN_SITE_URL || "" },
  poweredByHeader: false,
  images: { unoptimized: true },
  experimental: {
    // Cached data (lib/cached.ts, lib/content.ts) is kept in memory only. Next
    // keeps the record of what was cleared ("revalidated") in memory too, so a
    // copy left on disk could outlive a deletion across a restart. One process
    // per site (deploy/ecosystem.config.cjs): a restart simply starts fresh.
    isrFlushToDisk: false,
    serverActions: {
      // Images uploaded in the admin area: up to 10 MB.
      bodySizeLimit: "11mb",
      allowedOrigins: (process.env.IHERN_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean),
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      // Static files (the main site's stylesheets and images): a day for
      // stylesheets, 30 days for images and fonts. Uploaded images set their
      // own caching (app/wp-content/uploads).
      ...["/assets/:path*", "/style.css", "/iiit-logo.png"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      })),
      { source: "/assets/:dir(images|fonts)/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }] },
    ];
  },
};

export default nextConfig;
