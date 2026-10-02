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
    const mainHost = hostOf(process.env.IHERN_SITE_URL);
    const fromMain = mainHost !== "" && hostOf(req.headers.get("referer")) === mainHost && !req.cookies.get("ihern_sso_reprobe");
    if (!req.cookies.get("ihern_sso_probed") || fromMain) {
      // Served in place (a rewrite, not a redirect): the sign-in route
      // answers this request with its redirect to the main site, and its
      // cookies land on whatever host the reader used.
      const to = url.clone();
      to.pathname = "/api/sso/login";
      to.search = new URLSearchParams({ prompt: "none", return: url.pathname + url.search }).toString();
      return NextResponse.rewrite(to);
    }
  }
  return NextResponse.next();
}

function hostOf(u: string | null | undefined): string {
  try {
    return u ? new URL(u).host.toLowerCase() : "";
  } catch {
    return "";
  }
}

export const config = {
  // Pages and the front-page query routes; not assets, uploads, the admin or APIs.
  matcher: ["/((?!_next/|api/|admin|wp-content/|assets/|favicon|feed|sitemap|robots|.*\\.[a-z0-9]{2,5}$).*)"],
};
