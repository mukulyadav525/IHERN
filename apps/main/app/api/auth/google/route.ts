import { NextRequest, NextResponse } from "next/server";
import { safeReturn, SECURE_COOKIES } from "@/lib/auth";
import { googleAuthUrl, googleEnabled, googleRedirectUri, makeStateCookie, OAUTH_STATE_COOKIE } from "@/lib/oauth";
import { BASE_PATH } from "@/lib/paths";

/** Starts Google sign-in (ihern_google_auth_url()); the button only shows when it is configured. */

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const ret = safeReturn(req.nextUrl.searchParams.get("return"));

  if (!googleEnabled()) {
    const q = new URLSearchParams({ error: "google_off", return: ret });
    return new NextResponse(null, { status: 303, headers: { Location: `${BASE_PATH}/login?${q}` } });
  }

  const { state, value } = makeStateCookie(ret);
  const res = NextResponse.redirect(googleAuthUrl(state, googleRedirectUri()), { status: 303 });
  res.cookies.set(OAUTH_STATE_COOKIE, value, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600, secure: SECURE_COOKIES });
  return res;
}
