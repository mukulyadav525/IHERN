import { NextResponse } from "next/server";
import { currentEditor } from "@/lib/admin";
import { listSubscribers } from "@/lib/subscribers";
import { u } from "@/lib/paths";

/** The blog's active subscribers as CSV (blog admins only). */

export const dynamic = "force-dynamic";

/** One CSV field. A value a spreadsheet would run as a formula is prefixed with ' . */
function cell(v: string): string {
  let s = String(v ?? "");
  if (/^[=@\t\r]/.test(s) || /^[+-][^\d\s]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const me = await currentEditor();
  if (!me || typeof me === "string" || me.role !== "admin") {
    return new NextResponse(null, { status: 303, headers: { Location: u("/admin"), "Cache-Control": "no-store" } });
  }
  const rows = await listSubscribers("active");
  if (!rows) return new NextResponse("The database could not be reached.", { status: 503 });
  const lines = [["Name", "Email", "Subscribed since"].join(","), ...rows.map((r) => [r.name, r.email, r.since].map(cell).join(","))];
  return new NextResponse("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=IHERNBlogSubscribers.csv",
      "Cache-Control": "no-store",
    },
  });
}
