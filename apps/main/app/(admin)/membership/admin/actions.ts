"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { MEMBERS_TAG } from "@ihern/core/cached";
import {
  acceptInvite,
  accountMatchingAdmin,
  adminLogin,
  adminLogout,
  changeAdminPassword,
  currentAdmin,
  deleteAdmin,
  deleteMember,
  getMember,
  INVITE_PATH,
  inviteAdmin,
  listAdmins,
  newInvite,
  NotSignedIn,
  readInvite,
  requireAdmin,
  setAdminActive,
  setMemberPhoto,
  setMemberStatus,
  updateMember,
} from "@/lib/admin";
import { createResetToken, imageType, removePhoto, storePhoto } from "@/lib/membership";
import { sendAdminInvitation, sendPasswordReset, sendProfileUpdateRequests } from "@ihern/core/mail";
import { createAccount, getAccountByEmail } from "@ihern/core/store";
import { activeMember, MEMBERSHIP_UNREADABLE, NOT_A_MEMBER } from "@ihern/core/roles";
import { absoluteUrl } from "@ihern/core/env";
import { take, RESET_EMAILS } from "@ihern/core/ratelimit";
import { endSession, readSession, startSession } from "@/lib/auth";
import { backchannelLogout } from "@/lib/sso";
import { importMembers, readMembersCsv, IMPORT_MAX_BYTES } from "@/lib/member-import";
import { createUpdateRequests, RECENT_DAYS } from "@/lib/profile-update";

/** Every action checks the admin session itself: an action can be called without loading a page. */

export type ActionResult = { ok: boolean; message: string; error: string };
const done = (message: string): ActionResult => ({ ok: true, message, error: "" });
const failed = (error: string): ActionResult => ({ ok: false, message: "", error });
const UNAVAILABLE = "The membership database could not be reached. Please try again shortly.";

async function guard<T extends ActionResult>(fn: (adminId: number, who: { name: string; email: string }) => Promise<T | ActionResult>): Promise<T | ActionResult> {
  try {
    const who = await requireAdmin();
    return await fn(who.id, who);
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

/* ---------------- "please update your details" ---------------- */

/** One member: asked again even if asked recently; the email is sent before answering. */
export async function requestUpdateAction(id: number): Promise<ActionResult> {
  return guard(async (_id, me) => {
    const made = await createUpdateRequests([id], me.email, true);
    if (!made) return failed(UNAVAILABLE);
    if (made.inactive) return failed("This membership is inactive. Activate it first.");
    const r = made.requests[0];
    if (!r) return failed("This registration has no valid email address.");
    if (!(await sendProfileUpdateRequests([r]))) return failed("The email could not be sent just now. Please try again later.");
    refresh();
    return done(`${r.email} was asked to update their details. The link works for 14 days.`);
  });
}

/** Many members: the emails go out after the answer, one at a time. */
async function requestUpdates(ids: number[] | "active", by: string): Promise<ActionResult> {
  const made = await createUpdateRequests(ids, by);
  if (!made) return failed(UNAVAILABLE);
  const n = made.requests.length;
  if (n) after(() => sendProfileUpdateRequests(made.requests).then((sent) => console.log(`[membership admin] update requests: ${sent} of ${n} emailed`)));
  const notes = [
    made.recent ? `${made.recent} already asked in the last ${RECENT_DAYS} days` : "",
    made.inactive ? `${made.inactive} inactive` : "",
  ].filter(Boolean);
  if (!n) return failed(`Nobody to ask${notes.length ? ` (${notes.join(", ")})` : ""}.`);
  refresh();
  return done(`Asking ${n} ${n === 1 ? "member" : "members"} to update their details: the emails are going out now.${notes.length ? ` Left out: ${notes.join(", ")}.` : ""}`);
}

/** The Members list's selection: activate, deactivate, or ask to update; or ask every active member. */
export async function bulkMembersAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async (_id, me) => {
    const op = String(form.get("op") ?? "");
    if (op === "request-update-all") return requestUpdates("active", me.email);
    const ids = [...new Set(form.getAll("ids").map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 1000);
    if (!ids.length) return failed("Select members first: tick the boxes in the list.");
    if (op === "request-update") return requestUpdates(ids, me.email);
    if (op !== "activate" && op !== "deactivate") return failed("Choose what to do with the selected members.");
    let changed = 0;
    for (const id of ids) if (await setMemberStatus(id, op === "activate")) changed++;
    refresh();
    return done(`${changed} ${changed === 1 ? "membership" : "memberships"} ${op === "activate" ? "activated" : "deactivated"}.`);
  });
}

/* ---------------- admins ---------------- */

/** Emails the invitation; when mail cannot go, the message carries the link to pass on another way. */
async function sendInvite(email: string, token: string, by: { name: string; email: string }): Promise<ActionResult> {
  const link = absoluteUrl(`${INVITE_PATH.slice(1)}?token=${token}`);
  if (await sendAdminInvitation(email, by.name || by.email, link)) return done(`Invitation emailed to ${email}. The link works for 7 days.`);
  return done(`${email} is added, but the invitation email could not be sent. Send them this link yourself (it works for 7 days): ${link}`);
}

/** adAdminUser.php, by email alone: the new admin is invited and comes in with their IHERN account. */
export async function inviteAdminAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async (_id, me) => {
    const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 100);
    if (!EMAIL.test(email)) return failed("Please enter a valid email address.");
    // Admin access only for IHERN members.
    const member = await activeMember(email);
    if (member === "unavailable") return failed(MEMBERSHIP_UNREADABLE);
    if (!member) return failed(NOT_A_MEMBER);
    const res = await inviteAdmin(email, me.email);
    if (res === "exists") return failed("That email address already has an admin account. To send a new link, use Resend invitation.");
    if (res === "error") return failed(UNAVAILABLE);
    refresh();
    return sendInvite(email, res.token, me);
  });
}

export async function resendInviteAction(id: number): Promise<ActionResult> {
  return guard(async (_id, me) => {
    const admin = (await listAdmins())?.find((a) => a.id === id);
    if (!admin) return failed("This admin account no longer exists.");
    if (!admin.active) return failed("Activate the account first.");
    if (!take(RESET_EMAILS, `invite:${admin.email.toLowerCase()}`)) return failed("An invitation was sent recently. Please wait before sending another.");
    const token = await newInvite(id, me.email);
    if (!token) return failed(UNAVAILABLE);
    refresh();
    return sendInvite(admin.email, token, me);
  });
}

/* ---------------- accepting an invitation (no admin session yet) ---------------- */

/**
 * "Email me a new invitation link", on the sign-in page: for an invited admin
 * signed in to their IHERN account. The link goes to the admin's own address,
 * so asking for it proves nothing by itself - opening it does.
 */
export async function resendOwnInviteAction(): Promise<ActionResult> {
  try {
    const match = await accountMatchingAdmin();
    if (!match || !match.invited) return failed("There is no invitation for this account. Please ask a membership admin.");
    if (!take(RESET_EMAILS, `invite:${match.email.toLowerCase()}`)) return failed("A link was sent recently. Please check your inbox (and spam), or wait a while.");
    const token = await newInvite(match.adminId, match.email);
    if (!token) return failed(UNAVAILABLE);
    const link = absoluteUrl(`${INVITE_PATH.slice(1)}?token=${token}`);
    if (!(await sendAdminInvitation(match.email, "IHERN", link))) return failed("The email could not be sent just now. Please try again later.");
    return done(`A new invitation link was emailed to ${match.email}. Open it in this browser: it takes you straight in.`);
  } catch (e) {
    console.error("[membership admin]", (e as Error).message);
    return failed("Something went wrong. Please try again.");
  }
}

/** No IHERN account for the invited address yet: set it up from the link (the link proves the mailbox), then accept. */
export async function setUpInvitedAccountAction(token: string, prev: ActionResult, form: FormData): Promise<ActionResult> {
  const admin = await readInvite(token);
  if (admin === "unavailable") return failed(UNAVAILABLE);
  if (!admin) return failed("This invitation has expired or has already been used. Ask a membership admin to send a new one.");
  const name = String(form.get("name") ?? "").trim().slice(0, 150);
  const password = String(form.get("password") ?? "");
  if (!name) return failed("Please enter your name.");
  if (password.length < 10) return failed("Please choose a password of at least 10 characters.");
  if (password !== String(form.get("confirm") ?? "")) return failed("The two passwords do not match.");
  const existing = await getAccountByEmail(admin.email);
  if (existing.ok) return failed("An IHERN account already uses this address. Please sign in to it instead.");
  const created = await createAccount(admin.email, password, name);
  if (!created.ok) {
    return failed(
      created.reason === "exists"
        ? "An IHERN account already uses this address. Please sign in to it instead."
        : created.reason === "domain_not_allowed"
          ? "IHERN accounts cannot be set up for this email address. Please ask a membership admin."
          : "The account could not be set up just now. Please try again."
    );
  }
  await startSession(created.value.id, created.value.email, created.value.name);
  const res = await acceptInvite(token, created.value);
  if (res !== "ok") return failed("Your account is set up, but the invitation could not be accepted. Please open the link again.");
  redirect("/membership/admin");
}

/** Removes an admin for good. No email is sent. */
export async function removeAdminAction(id: number): Promise<ActionResult> {
  return guard(async (me) => {
    if (id === me) return failed("You cannot remove your own account here.");
    const all = (await listAdmins()) ?? [];
    const target = all.find((a) => a.id === id);
    if (!target) return failed("Already removed.");
    if (target.active && all.filter((a) => a.active).length <= 1) return failed("The membership admin needs at least one active admin.");
    if (!(await deleteAdmin(id))) return failed("Could not remove it just now.");
    refresh();
    return done(`${target.email} removed from the membership admin.`);
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
