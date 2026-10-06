"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { absoluteUrl } from "@ihern/core/env";
import { sendAdminAccessGranted, sendIhercBalanceRequest } from "@ihern/core/mail";
import { activeMember, MEMBERSHIP_UNREADABLE, NOT_A_MEMBER } from "@ihern/core/roles";
import { parseCsv } from "@/lib/member-import";
import { isXlsx, readXlsx } from "@/lib/xlsx";
import {
  addIhercEditor,
  checkPayment,
  deleteImport,
  FIELD_NAMES,
  getPayment,
  importPayments,
  listIhercEditors,
  listPayments,
  markBalanceAsked,
  memberIndex,
  readPayments,
  removeIhercEditor,
  setIhercEditorActive,
  setResolved,
  type MemberIndex,
  type Payment,
  type PaymentField,
} from "@/lib/iherc";
import { PAYMENT_FORM, rupees } from "@/lib/iherc-fees";
import { NotAllowed, requireIhercUser, type IhercUser } from "@/lib/iherc-admin";

/** Everything the IHERC admin changes. Every action checks the caller first. */

export type ActionResult = { ok: boolean; message: string; error: string; id?: number };
const done = (message: string, id?: number): ActionResult => ({ ok: true, message, error: "", id });
const failed = (error: string): ActionResult => ({ ok: false, message: "", error });
const UNAVAILABLE = "The database could not be reached. Please try again shortly.";

async function guard<T extends ActionResult>(fn: (who: IhercUser) => Promise<T | ActionResult>, role: "editor" | "admin" = "editor"): Promise<T | ActionResult> {
  try {
    return await fn(await requireIhercUser(role));
  } catch (e) {
    if (e instanceof NotAllowed) return failed(e.message);
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error("[iherc admin]", (e as Error).message);
    return failed("Something went wrong. Please try again.");
  }
}

const refresh = () => revalidatePath("/iherc2026/admin", "layout");

/* ---------------- importing finance's list ---------------- */

const IMPORT_MAX_BYTES = 5 * 1024 * 1024;
const IMPORT_MAX_ROWS = 5000;

export type ImportState = ActionResult & {
  report?: { dryRun: boolean; rows: number; added: number; known: number; columns: string[]; missing: string[] };
};

/** "check": reads the file and says what it found; "import": stores the payments too. */
export async function importPaymentsAction(prev: ImportState, form: FormData): Promise<ImportState> {
  return guard<ImportState>(async (who) => {
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return failed("Please choose the payments file.");
    if (file.size > IMPORT_MAX_BYTES) return failed("The file is larger than 5 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let table: string[][];
    try {
      if (isXlsx(bytes)) table = readXlsx(bytes);
      else if (/\.xls$/i.test(file.name)) return failed("This is an old-style Excel file (.xls). Please open it and save it as .xlsx or .csv.");
      else table = parseCsv(new TextDecoder("utf-8").decode(bytes).replace(/^﻿/, ""));
    } catch {
      return failed("The file could not be read. Please upload the list as an Excel file (.xlsx) or a CSV file.");
    }
    const { rows, columns, error } = readPayments(table);
    if (error) return failed(error);
    if (!rows.length) return failed("The file has headings but no payments.");
    if (rows.length > IMPORT_MAX_ROWS) return failed(`The file has ${rows.length} rows; up to ${IMPORT_MAX_ROWS} can be imported at once.`);
    const found = columns.map((c) => FIELD_NAMES[c]);
    const wanted: PaymentField[] = ["email", "membershipNo", "category", "amount", "ref", "paidAt"];
    const missing = wanted.filter((f) => !columns.includes(f)).map((f) => FIELD_NAMES[f]);
    const dryRun = form.get("mode") !== "import";
    if (dryRun) {
      return { ...done(`Found ${rows.length} payment${rows.length === 1 ? "" : "s"}. Nothing has been imported yet.`), report: { dryRun, rows: rows.length, added: 0, known: 0, columns: found, missing } };
    }
    const res = await importPayments(rows, file.name, who.email);
    if (!res) return failed(UNAVAILABLE);
    refresh();
    return {
      ...done(`Imported: ${res.added} new payment${res.added === 1 ? "" : "s"}${res.known ? `, ${res.known} already in the list` : ""}.`),
      report: { dryRun, rows: rows.length, added: res.added, known: res.known, columns: found, missing },
    };
  });
}

export async function deleteImportAction(id: number): Promise<ActionResult> {
  return guard(async () => {
    const n = await deleteImport(id);
    if (n === null) return failed(UNAVAILABLE);
    refresh();
    return done(`Import undone: ${n} payment${n === 1 ? "" : "s"} removed.`);
  });
}

/* ---------------- resolving ---------------- */

export async function resolvePaymentAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async (who) => {
    const id = Number(form.get("id"));
    if (!Number.isInteger(id) || id < 1) return failed("Unknown payment.");
    const resolved = form.get("resolved") === "1";
    const note = String(form.get("note") ?? "").trim().slice(0, 500);
    if (!(await setResolved(id, resolved, note, who.email))) return failed("This payment no longer exists.");
    refresh();
    return done(resolved ? "Marked as sorted out." : "Saved.");
  });
}

export async function setResolvedAction(id: number, resolved: boolean): Promise<ActionResult> {
  return guard(async (who) => {
    const p = await getPayment(id);
    if (p === "error") return failed(UNAVAILABLE);
    if (!p) return failed("This payment no longer exists.");
    if (!(await setResolved(id, resolved, p.note, who.email))) return failed("Could not change it just now.");
    refresh();
    return done(resolved ? "Marked as sorted out." : "Marked as needing attention again.");
  });
}

/* ---------------- asking for a balance ---------------- */

function balanceMail(p: Payment, members: MemberIndex) {
  const v = checkPayment(p, members);
  return {
    v,
    mail: {
      name: p.name,
      email: p.email,
      paid: rupees(p.amount ?? 0),
      due: rupees(v.expected),
      balance: rupees(v.balance),
      reason: v.notes[0] ?? "The amount paid is less than the registration fee for your category.",
      ref: p.ref,
      payLink: PAYMENT_FORM,
      page: absoluteUrl("join"),
    },
  };
}

const canAsk = (p: Payment) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email);

export async function askBalanceAction(id: number): Promise<ActionResult> {
  return guard(async () => {
    const [p, members] = await Promise.all([getPayment(id), memberIndex()]);
    if (p === "error" || !members) return failed(UNAVAILABLE);
    if (!p) return failed("This payment no longer exists.");
    if (!canAsk(p)) return failed("This payment has no email address to write to.");
    const { v, mail } = balanceMail(p, members);
    if (v.state !== "due") return failed("Nothing is due on this payment.");
    if (!(await sendIhercBalanceRequest(mail))) return failed("The email could not be sent. Please try again.");
    await markBalanceAsked([id]);
    refresh();
    return done(`Emailed ${p.email}: balance of ${rupees(v.balance)}.`);
  });
}

/** Everyone with a balance due who has not been asked yet (and is not marked as sorted out). */
export async function askAllBalancesAction(): Promise<ActionResult> {
  return guard(async () => {
    const [payments, members] = await Promise.all([listPayments(), memberIndex()]);
    if (!payments || !members) return failed(UNAVAILABLE);
    const todo = payments.filter((p) => !p.resolved && !p.balanceAskedAt && canAsk(p)).map((p) => ({ p, ...balanceMail(p, members) })).filter((x) => x.v.state === "due");
    if (!todo.length) return failed("Nobody left to ask: everyone with a balance due has been emailed, or is marked as sorted out.");
    await markBalanceAsked(todo.map((x) => x.p.id));
    after(async () => {
      let sent = 0;
      for (const x of todo) if (await sendIhercBalanceRequest(x.mail)) sent++;
      console.log(`[iherc] balance requests: ${sent} of ${todo.length} sent`);
    });
    refresh();
    return done(`Emailing ${todo.length} ${todo.length === 1 ? "person" : "people"} about their balance now.`);
  });
}

/* ---------------- who may use it (admins) ---------------- */

export async function addIhercEditorAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async (me) => {
    const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 190);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return failed("Please enter a valid email address.");
    const member = await activeMember(email);
    if (member === "unavailable") return failed(MEMBERSHIP_UNREADABLE);
    if (!member) return failed(NOT_A_MEMBER);
    const role = form.get("role") === "admin" ? "admin" : "editor";
    const res = await addIhercEditor(email, role);
    if (!res) return failed(UNAVAILABLE);
    refresh();
    const as = role === "admin" ? "an admin" : "an editor";
    if (res === "updated") return done(`${email} can use the IHERC admin as ${as}.`);
    const mailed = await sendAdminAccessGranted(email, member.name, "IHERC admin (registrations and payments)", role, absoluteUrl("iherc2026/admin"), me.name || me.email);
    return done(`${email} can now use the IHERC admin as ${as}. ${mailed ? "They have been emailed about it." : "The email to tell them could not be sent: please let them know."}`);
  }, "admin");
}

export async function setIhercEditorActiveAction(id: number, active: boolean): Promise<ActionResult> {
  return guard(async (me) => {
    const target = ((await listIhercEditors()) ?? []).find((e) => e.id === id);
    if (!target) return failed("Already removed.");
    if (target.email === me.email.toLowerCase()) return failed("You cannot change your own access.");
    if (!(await setIhercEditorActive(id, active))) return failed("Could not change it just now.");
    refresh();
    return done(active ? `${target.email} is active again.` : `${target.email} is deactivated.`);
  }, "admin");
}

export async function removeIhercEditorAction(id: number): Promise<ActionResult> {
  return guard(async (me) => {
    const target = ((await listIhercEditors()) ?? []).find((e) => e.id === id);
    if (!target) return failed("Already removed.");
    if (target.email === me.email.toLowerCase()) return failed("You cannot remove yourself.");
    if (!(await removeIhercEditor(id))) return failed("Could not remove it just now.");
    refresh();
    return done(`${target.email} removed.`);
  }, "admin");
}
