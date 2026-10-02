/** @type {import('next').NextConfig} */

// Serve the site from a sub-path (the PHP site lives at https://iiitd.ac.in/IHERN/)
// by building with NEXT_PUBLIC_BASE_PATH=/IHERN. Empty = the domain root.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");

// Every address the PHP site answered at keeps working: bookmarks, search
// results, links in old emails, and the WordPress blog's navigation all point
// at these .php URLs.
const pageAliases = [
  ["/index.php", "/"],
  ["/about.php", "/about"],
  ["/initiatives.php", "/initiatives"],
  ["/members.php", "/members"],
  ["/stc.php", "/stc"],
  ["/sig.php", "/sig"],
  ["/reports.php", "/reports"],
  ["/blog.php", "/blogs"],
  ["/blog-login.php", "/login"],
  ["/blog-account.php", "/account"],
  ["/blog-logout.php", "/logout"],
  ["/applications", "/membership/login"],
  ["/applications/index.php", "/membership/login"],
  ["/applications/register.php", "/join"],
  ["/applications/forgotPassword.php", "/membership/forgot-password"],
  ["/applications/resetpass.php", "/membership/reset-password"],
  ["/applications/dashboard.php", "/membership/dashboard"],
  ["/applications/personalInformations.php", "/membership/dashboard"],
  ["/applications/logout.php", "/membership/logout"],
  // The membership admin panel (applications/admin).
  ["/applications/admin", "/membership/admin"],
  ["/applications/admin/index.php", "/membership/admin/login"],
  ["/applications/admin/adminDashboard.php", "/membership/admin"],
  ["/applications/admin/viewStudentDetails.php", "/membership/admin/members"],
  ["/applications/admin/adAdminUser.php", "/membership/admin/admins"],
  ["/applications/admin/changePassword.php", "/membership/admin/password"],
  ["/applications/admin/logout.php", "/membership/admin/logout"],
  ["/iherc2026/index.html", "/iherc2026"],
  ["/iherc2026/abstract.html", "/iherc2026/abstract"],
  ["/iherc2026/registration.html", "/iherc2026/registration"],
  ["/iherc2026/program.html", "/iherc2026"],
  ["/iherc2025/index.html", "/iherc2025"],
  ["/iherc2025/abstract.html", "/iherc2025/abstract"],
  ["/iherc2025/registration.html", "/iherc2025/registration"],
  ["/iherc2025/program.html", "/iherc2025/program"],
];

// Short, friendly addresses.
const friendly = [
  ["/blog", "/blogs"],
  ["/steering-committee", "/stc"],
  ["/sigs", "/sig"],
  ["/conferences", "/iherc2026"],
  ["/applications/register", "/join"],
];

const nextConfig = {
  reactStrictMode: true,
  // The shared package (packages/core) is TypeScript source.
  transpilePackages: ["@ihern/core"],
  basePath: basePath || undefined,
  poweredByHeader: false,
  images: { unoptimized: true },
  experimental: {
    // Cached data (lib/cached.ts, lib/content.ts) is kept in memory only. Next
    // keeps the record of what was cleared ("revalidated") in memory too, so a
    // copy left on disk could outlive a deletion across a restart. One process
    // per site (deploy/ecosystem.config.cjs): a restart simply starts fresh.
    isrFlushToDisk: false,
    // Unknown addresses get app/global-not-found.tsx: complete HTML with a 404
    // status, readable without JavaScript.
    globalNotFound: true,
    serverActions: {
      // The membership form accepts a photograph of up to 5 MB.
      bodySizeLimit: "6mb",
      // Forms are accepted only from this site's own origin. Behind a proxy
      // that rewrites the Host header, list the public host here
      // (IHERN_ALLOWED_ORIGINS=iiitd.ac.in).
      allowedOrigins: (process.env.IHERN_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean),
    },
  },
  async redirects() {
    return [
      ...pageAliases.map(([source, destination]) => ({ source, destination, permanent: true })),
      ...friendly.map(([source, destination]) => ({ source, destination, permanent: false })),
      { source: "/webinars", destination: "/#events_heading", permanent: false },
    ];
  },
  async rewrites() {
    // Served in place (not redirected): the blog posts to these server-to-server
    // and a redirect would turn its POST into a GET. Google also returns to
    // blog-oauth.php, the redirect URI registered for the PHP site.
    return {
      beforeFiles: [
        { source: "/sso-authorize.php", destination: "/api/sso/authorize" },
        { source: "/sso-token.php", destination: "/api/sso/token" },
        { source: "/sso-userinfo.php", destination: "/api/sso/userinfo" },
        { source: "/sso-subscription.php", destination: "/api/sso/subscription" },
        { source: "/sso-logout.php", destination: "/api/sso/logout" },
        { source: "/sso-notify.php", destination: "/api/sso/notify" },
        { source: "/blog-oauth.php", destination: "/api/auth/google/callback" },
      ],
    };
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
      // Static files. The PHP site's stylesheets and images keep their names
      // between releases, so they are cached for a day (re-checked in the
      // background for a week after); images and fonts, which never change
      // under the same name, for 30 days. Without this every page view
      // re-requested ~30 files.
      ...[
        "/assets/:path*",
        "/style.css",
        "/:conf(iherc2025|iherc2026)/assets/:path*",
        "/:conf(iherc2025|iherc2026)/:file([^/]+\\.(?:jpe?g|JPE?G|png|pdf))",
        "/:file([^/]+\\.pdf)",
      ].map((source) => ({ source, headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] })),
      { source: "/assets/:dir(images|fonts)/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }] },
      { source: "/:conf(iherc2025|iherc2026)/assets/:dir(img|fonts)/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }] },
    ];
  },
};

export default nextConfig;
