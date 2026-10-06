import { checkPayment, listPayments, memberIndex } from "@/lib/iherc";
import { NotAllowed, requireIhercUser } from "@/lib/iherc-admin";

/** Every payment with its check, as a CSV file (for finance, or a spreadsheet). */

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // A leading = + - @ would run as a formula in a spreadsheet.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET() {
  try {
    await requireIhercUser();
  } catch (e) {
    if (e instanceof NotAllowed) return new Response("Not allowed", { status: 403 });
    throw e;
  }
  const [payments, members] = await Promise.all([listPayments(), memberIndex()]);
  if (!payments || !members) return new Response("The database could not be reached.", { status: 503 });
  const head = ["Date", "Reference", "Name", "Email", "Contact", "Their category", "Says member", "Membership number given", "Member found", "Checked category", "Paid", "Fee", "Balance", "Check", "Reason", "Sorted out", "Balance asked", "Note"];
  const lines = [head.map(cell).join(",")];
  for (const p of payments) {
    const v = checkPayment(p, members);
    lines.push(
      [p.paidAt, p.ref, p.name, p.email, p.phone, p.category, p.saysMember, p.membershipNo, v.member ? v.member.number : "", v.category, p.amount ?? "", v.expected, v.state === "due" ? v.balance : 0, v.state, v.notes.join(" "), p.resolved ? "yes" : "", p.balanceAskedAt, p.note]
        .map(cell)
        .join(",")
    );
  }
  const date = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="iherc2026-payments-${date}.csv"`, "Cache-Control": "no-store" },
  });
}
