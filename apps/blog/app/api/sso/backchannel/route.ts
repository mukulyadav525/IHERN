import { NextRequest, NextResponse } from "next/server";
import { backchannelLogout } from "@/lib/session";

/**
 * The main site tells the blog that a reader signed out there (served at
 * /?ihern_sso=backchannel-logout). Answers "ok" when the signature checks
 * out and the reader's blog sessions are gone.
 */

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new NextResponse("bad request", { status: 400 });
  }
  const ok = await backchannelLogout(String(form.get("sub") ?? ""), String(form.get("ts") ?? ""), String(form.get("sig") ?? ""));
  return new NextResponse(ok ? "ok" : "denied", { status: ok ? 200 : 403, headers: { "Cache-Control": "no-store" } });
}
