import { NextResponse, type NextRequest } from "next/server";
import { currentAdmin, exportMembers } from "@/lib/admin";
import { membershipNumber } from "@/lib/membership-options";
import { BASE_PATH } from "@/lib/paths";

/**
 * exportStudentDetails.php: the active members as CSV, in membership-number
 * order, with the same columns (?all=1 adds inactive registrations and a
 * Status column). Unlike the PHP export, it needs a signed-in admin.
 */

export const dynamic = "force-dynamic";

const HEADERS = [
  "S.No.", "Membership No.", "Candidate Name", "Candidate Email", "Candidate Mobile", "Organisation",
  "Areas of Research Interest", "Areas of Research Interest in Higher Education", "Your Title", "Website Link", "Photo", "Registration Date",
];

/** One CSV field. A value a spreadsheet would run as a formula is prefixed with ' . */
function cell(v: string | number): string {
  let s = String(v ?? "");
  if (/^[=@\t\r]/.test(s) || /^[+-][^\d\s]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const who = await currentAdmin();
  if (!who || who === "unavailable") {
    return new NextResponse(null, { status: 303, headers: { Location: `${BASE_PATH}/membership/admin/login`, "Cache-Control": "no-store" } });
  }
  const all = req.nextUrl.searchParams.get("all") === "1";
  const rows = await exportMembers(all);
  if (!rows) return new NextResponse("The membership database could not be reached.", { status: 503 });

  const lines = [(all ? [...HEADERS, "Status"] : HEADERS).map(cell).join(",")];
  rows.forEach((m, i) => {
    const values: (string | number)[] = [
      i + 1, membershipNumber(m), m.studentName, m.studentEmail, m.studentMobile, m.institutionName,
      m.areasofinterest, m.areasofinteresthe, m.yourTitle, m.url, m.photo, m.regDate,
    ];
    if (all) values.push(m.userStatus === "Y" ? "Active" : "Inactive");
    lines.push(values.map(cell).join(","));
  });
  // A byte-order mark so Excel reads names in any script correctly.
  const body = "﻿" + lines.join("\r\n") + "\r\n";
  const name = all ? "IHERNAllRegistrations.csv" : "IHERNCandidateDetails.csv";
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${name}`,
      "Cache-Control": "no-store",
    },
  });
}
