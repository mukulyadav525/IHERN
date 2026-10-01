import { NextResponse } from "next/server";
import { adminLogout } from "@/lib/admin";
import { BASE_PATH } from "@/lib/paths";

/** applications/admin/logout.php. */

export const dynamic = "force-dynamic";

export async function GET() {
  await adminLogout();
  return new NextResponse(null, { status: 303, headers: { Location: `${BASE_PATH}/membership/admin/login`, "Cache-Control": "no-store" } });
}
