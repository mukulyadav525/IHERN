import { NextRequest, NextResponse } from "next/server";

/**
 * Requests that arrive at the blog's front page with query parameters:
 *
 *  - single sign-on, at the addresses the main site (and the old WordPress
 *    plugin) use:  /?ihern_sso=callback | backchannel-logout | login | logout
 *  - old WordPress links: /?p=196, /?page_id=30, /?cat=6, /?tag=x,
 *    /?author=5, /?s=..., /?feed=rss2, /?m=202606, /?paged=2
 *
 * and the silent sign-in check: a reader's first page view (or one arriving
 * from the main site) asks the main site, without showing anything, whether
 * they are already signed in there.
 */

const SSO_ROUTES: Record<string, string> = {
  callback: "/api/sso/callback",
  "backchannel-logout": "/api/sso/backchannel",
  login: "/api/sso/login",
  logout: "/api/sso/logout",
};
const LEGACY_PARAMS = ["p", "page_id", "cat", "tag", "author", "s", "feed", "m", "paged"];
/** The silent sign-in check's page, for /api/sso/login (see below). */
const PROBE_HEADER = "x-ihern-sso-probe";
const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|curl|wget|python|headless/i;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const params = url.searchParams;

  if (url.pathname === "/") {
    const sso = params.get("ihern_sso");
    if (sso && SSO_ROUTES[sso]) {
      const to = url.clone();
      to.pathname = SSO_ROUTES[sso];
      to.searchParams.delete("ihern_sso");
      return NextResponse.rewrite(to);
    }
    if (LEGACY_PARAMS.some((p) => params.has(p))) {
      const to = url.clone();
      to.pathname = "/api/legacy";
      return NextResponse.rewrite(to);
    }
  }

  // Silent sign-in check: page navigations only, for people, not crawlers.
  const isPage = req.method === "GET" && (req.headers.get("sec-fetch-dest") === "document" || (req.headers.get("accept") || "").includes("text/html")) && !req.headers.get("rsc");
  if (isPage && !req.cookies.get("ihern_blog_session") && !BOTS.test(req.headers.get("user-agent") || "")) {
    const fromMain = fromMainSite(req.headers.get("referer")) && !req.cookies.get("ihern_sso_reprobe");
    if (!req.cookies.get("ihern_sso_probed") || fromMain) {
      // Served in place (a rewrite, not a redirect): the sign-in route
      // answers this request with its redirect to the main site, and its
      // cookies land on whatever host the reader used. The route sees this
      // request's own query string, not one set here, so "silently, then
      // back to this page" travels in a request header.
      const to = url.clone();
      to.pathname = "/api/sso/login";
      const headers = new Headers(req.headers);
      headers.set(PROBE_HEADER, url.pathname + url.search);
      return NextResponse.rewrite(to, { request: { headers } });
    }
  }
  return NextResponse.next();
}

/**
 * Did the reader come from a main-site page? The two sites can share a host
 * (iiitd.ac.in/IHERN and iiitd.ac.in/IHERN/blog), so the host alone is not
 * enough: the page must be on the main site's path and not on the blog's own.
 */
function fromMainSite(referer: string | null): boolean {
  try {
    if (!referer || !process.env.IHERN_SITE_URL) return false;
    const from = new URL(referer);
    const main = new URL(process.env.IHERN_SITE_URL);
    if (from.host.toLowerCase() !== main.host.toLowerCase()) return false;
    const blogBase = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");
    if (blogBase && (from.pathname === blogBase || from.pathname.startsWith(blogBase + "/"))) return false;
    return from.pathname.startsWith(main.pathname.replace(/\/+$/, "") || "/");
  } catch {
    return false;
  }
}

export const config = {
  // Pages and the front-page query routes; not assets, uploads, the admin or APIs.
  // "/" on its own too: under a base path (/IHERN/blog) the pattern below does
  // not match the bare front page, where sign-in and old links arrive.
  matcher: ["/", "/((?!_next/|api/|admin|wp-content/|assets/|favicon|feed|sitemap|robots|.*\\.[a-z0-9]{2,5}$).*)"],
};
