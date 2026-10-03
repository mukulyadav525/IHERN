"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { MEMBERS_TAG } from "@ihern/core/cached";
import {
  addAdmin,
  adminLogin,
  adminLogout,
  changeAdminPassword,
  currentAdmin,
  deleteMember,
  getMember,
  NotSignedIn,
  requireAdmin,
  setAdminActive,
  setMemberPhoto,
  setMemberStatus,
  updateMember,
} from "@/lib/admin";
import { createResetToken, imageType, removePhoto, storePhoto } from "@/lib/membership";
import { sendPasswordReset } from "@ihern/core/mail";
import { absoluteUrl } from "@ihern/core/env";
import { take, RESET_EMAILS } from "@ihern/core/ratelimit";
import { endSession, readSession } from "@/lib/auth";
import { backchannelLogout } from "@/lib/sso";
import { importMembers, readMembersCsv, IMPORT_MAX_BYTES } from "@/lib/member-import";

/** Every action checks the admin session itself: an action can be called without loading a page. */

export type ActionResult = { ok: boolean; message: string; error: string };
const done = (message: string): ActionResult => ({ ok: true, message, error: "" });
const failed = (error: string): ActionResult => ({ ok: false, message: "", error });
const UNAVAILABLE = "The membership database could not be reached. Please try again shortly.";

async function guard<T extends ActionResult>(fn: (adminId: number) => Promise<T | ActionResult>): Promise<T | ActionResult> {
  try {
    const who = await requireAdmin();
    return await fn(who.id);
  } catch (e) {
    if (e instanceof NotSignedIn) return failed(e.message);
    console.error("[membership admin]", (e as Error).message);
    return failed("Something went wrong. Please try again.");
  }
}

const refresh = () => {
  revalidatePath("/membership/admin", "layout");
  revalidateTag(MEMBERS_TAG);
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------------- sign-in ---------------- */

export type LoginState = { error: string; email: string };

export async function signInAdmin(prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email address and password.", email };
  const res = await adminLogin(email, password);
  if (res === "ok") redirect("/membership/admin");
  const error = {
    error: "Those details do not match an admin account.",
    inactive: "This admin account is not active.",
    throttled: "Too many unsuccessful attempts. Please wait 15 minutes and try again.",
    unavailable: UNAVAILABLE,
  }[res];
  return { error, email };
}

export async function signOutAdmin(): Promise<void> {
  const who = await currentAdmin();
  await adminLogout();
  // In through the IHERN account: sign out of that too, everywhere (as
  // /logout does), or the account would sign the admin straight back in.
  if (who && who !== "unavailable" && who.viaAccount) {
    const session = await readSession();
    if (session) await backchannelLogout(session.id);
    await endSession();
  }
  redirect("/membership/admin/login");
}

/* ---------------- members ---------------- */

export async function setMemberStatusAction(id: number, active: boolean): Promise<ActionResult> {
  return guard(async () => {
    if (!(await setMemberStatus(id, active))) return failed("Could not change it just now.");
    refresh();
    return done(active ? "Membership activated." : "Membership deactivated.");
  });
}

export async function deleteMemberAction(id: number): Promise<ActionResult> {
  return guard(async () => {
    if (!(await deleteMember(id))) return failed("Could not delete it just now.");
    refresh();
    return done("Registration deleted.");
  });
}

export async function saveMemberAction(id: number, prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const f = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
    const position = f("yourTitle", 150);
    const other = f("anyothervalue", 100);
    const m = {
      studentName: f("studentName", 100),
      studentEmail: f("studentEmail", 100),
      studentMobile: f("studentMobile", 50),
      yourTitle: position === "Any other" && other ? other : position,
      institutionName: f("institutionName", 200),
      areasofinterest: f("areasofinterest", 5000),
      areasofinteresthe: f("areasofinteresthe", 5000),
      url: f("url", 255),
      userStatus: (form.get("userStatus") === "Y" ? "Y" : "N") as "Y" | "N",
    };
    const problems: string[] = [];
    if (!m.studentName) problems.push("the name");
    if (!EMAIL.test(m.studentEmail)) problems.push("a valid email address");
    if (!m.studentMobile) problems.push("the mobile number");
    if (problems.length) return failed(`Please enter ${problems.join(", ")}.`);
    if (m.url && !/^https?:\/\//i.test(m.url)) m.url = "https://" + m.url;

    const res = await updateMember(id, m);
    if (res === "taken") return failed("Another registration already uses that email address.");
    if (res === "missing") return failed("This registration no longer exists.");
    if (res === "error") return failed(UNAVAILABLE);

    // The photograph: replaced, removed, or left alone.
    const file = form.get("photo");
    if (file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) return failed("Details saved, but the photograph is larger than 5 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const ext = imageType(bytes);
      if (!ext) return failed("Details saved, but the photograph must be a JPEG or PNG image.");
      const name = await storePhoto(bytes, ext, m.studentMobile || String(id));
      if (!name) return failed("Details saved, but the photograph could not be stored.");
      if (!(await setMemberPhoto(id, name))) {
        await removePhoto(name);
        return failed("Details saved, but the photograph could not be saved.");
      }
    } else if (form.get("removePhoto") === "1") {
      await setMemberPhoto(id, null);
    }
    refresh();
    return done("Saved.");
  });
}

/** Emails the member a password reset link (the member's own forgot-password flow). */
export async function sendMemberResetAction(id: number): Promise<ActionResult> {
  return guard(async () => {
    const member = await getMember(id);
    if (member === "error") return failed(UNAVAILABLE);
    if (!member) return failed("This registration no longer exists.");
    if (!take(RESET_EMAILS, member.studentEmail.toLowerCase())) return failed("A reset link was sent to this address recently. Please wait before sending another.");
    const token = await createResetToken(member.studentEmail);
    if (!token || token === "error") return failed(UNAVAILABLE);
    const link = absoluteUrl(`membership/reset-password?id=${encodeURIComponent(token.id)}&code=${token.code}`);
    if (!(await sendPasswordReset(member.studentEmail, link))) return failed("The email could not be sent just now.");
    return done(`A password reset link was emailed to ${member.studentEmail}.`);
  });
}

/* ---------------- admins ---------------- */

export async function addAdminAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const name = String(form.get("name") ?? "").trim().slice(0, 100);
    const email = String(form.get("email") ?? "").trim().slice(0, 100);
    const mobile = String(form.get("mobile") ?? "").trim().slice(0, 50);
    const password = String(form.get("password") ?? "");
    if (!name || !EMAIL.test(email)) return failed("Please enter a name and a valid email address.");
    if (password.length < 10) return failed("The password must be at least 10 characters.");
    const res = await addAdmin(name, email, mobile, password);
    if (res === "exists") return failed("That email address already has an admin account.");
    if (res === "error") return failed(UNAVAILABLE);
    refresh();
    return done(`${email} can now sign in to the membership admin.`);
  });
}

export async function setAdminActiveAction(id: number, active: boolean): Promise<ActionResult> {
  return guard(async (me) => {
    if (id === me) return failed("You cannot change your own account here.");
    if (!(await setAdminActive(id, active))) return failed("Could not change it just now.");
    refresh();
    return done(active ? "Admin account activated." : "Admin account deactivated.");
  });
}

export async function changePasswordAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async (me) => {
    const current = String(form.get("current") ?? "");
    const next = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (next.length < 10) return failed("The new password must be at least 10 characters.");
    if (next !== confirm) return failed("The new passwords do not match.");
    const res = await changeAdminPassword(me, current, next);
    if (res === "wrong") return failed("Your current password is not correct.");
    if (res === "error") return failed(UNAVAILABLE);
    return done("Password changed. Any other signed-in browsers have been signed out.");
  });
}


/* ---------------- import ---------------- */

export type ImportState = ActionResult & {
  /** set after a check or an import */
  report?: { dryRun: boolean; added: number; updated: number; unchanged: number; problems: { line: number; reason: string }[] };
};

/** Members from a CSV file: "check" counts what would happen, "import" does it. */
export async function importMembersAction(prev: ImportState, form: FormData): Promise<ImportState> {
  return guard<ImportState>(async () => {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return failed("Please choose a CSV file.");
    if (file.size > IMPORT_MAX_BYTES) return failed("The file is larger than 2 MB. Please split it.");
    if (!/\.csv$/i.test(file.name) && !/csv|text\/plain|excel/i.test(file.type)) return failed("Please choose a CSV file (in a spreadsheet: Save as / Download as → CSV).");
    const read = readMembersCsv(await file.text());
    if (read.error) return failed(read.error);

    const dryRun = form.get("mode") !== "import";
    const sum = await importMembers(read.rows, {
      update: form.get("update") === "1",
      newStatus: form.get("newStatus") === "N" ? "N" : "Y",
      dryRun,
    });
    if (!sum) return failed(UNAVAILABLE);
    if (!dryRun && (sum.added || sum.updated)) refresh();
    const problems = [...read.problems, ...sum.failed].sort((a, b) => a.line - b.line);
    const report = { dryRun, added: sum.added, updated: sum.updated, unchanged: sum.unchanged, problems };
    const message = dryRun
      ? "Checked. Nothing has been changed yet: review the numbers below, then choose Import."
      : `Imported: ${sum.added} added, ${sum.updated} updated.`;
    return { ...done(message), report };
  });
}
