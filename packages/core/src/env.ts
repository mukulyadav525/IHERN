/**
 * Which environment is this, and where do things live?
 *
 * Mirrors includes/environment.php: development-only behaviour (localhost
 * redirect URIs, the local SSO secret) can never be active on the live server
 * by accident. Set IHERN_ENV explicitly on a server; with nothing set,
 * `next dev` counts as development and everything else as production.
 */

export function isDev(): boolean {
  const explicit = (process.env.IHERN_ENV || "").toLowerCase();
  if (explicit) return explicit === "development";
  return process.env.NODE_ENV === "development";
}

/**
 * The canonical address of the main IHERN site, with a trailing slash and
 * including any base path (https://ihern.iiitd.edu.in/ by default). Used in
 * emails, canonical URLs and anywhere an absolute URL is unavoidable. Matches
 * IHERN_MAIN_SITE_URL / IHERN_SSO_BASE in the blog's wp-config.php.
 */
export function siteUrl(): string {
  const v = process.env.IHERN_SITE_URL || (isDev() ? "http://localhost:3000/" : "https://ihern.iiitd.edu.in/");
  return v.replace(/\/+$/, "") + "/";
}

/** An absolute URL on this site: siteUrl() + path (path without a leading slash is fine too). */
export function absoluteUrl(path = ""): string {
  return siteUrl() + path.replace(/^\/+/, "");
}

/** The IHERN Blog's public address, no trailing slash (apps/blog). */
export function blogUrl(): string {
  const v = process.env.IHERN_BLOG_URL || (isDev() ? "http://localhost:3001" : "https://ihern.iiitd.edu.in/blog");
  return v.replace(/\/+$/, "");
}
