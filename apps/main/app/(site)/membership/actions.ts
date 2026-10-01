"use server";

import { createResetToken, memberLogin, resetLinkValid, resetPassword } from "@/lib/membership";
import { sendPasswordReset } from "@ihern/core/mail";
import { absoluteUrl } from "@ihern/core/env";
import { allowed, clear, hit, take, RESET_EMAILS, SIGN_IN_FAILURES } from "@ihern/core/ratelimit";

/** The membership area's forms (applications/index.php, forgotPassword.php, resetpass.php). */

export type MemberLoginState = { error: "" | "error" | "inactive" | "unavailable" | "throttled"; email: string; next?: string };

export async function signInMember(prev: MemberLoginState, form: FormData): Promise<MemberLoginState> {
  const email = String(form.get("txtemail") ?? "").trim();
  const password = String(form.get("txtupass") ?? "").trim();
  const key = "member:" + email;
  if (!allowed(SIGN_IN_FAILURES, key)) return { error: "throttled", email };
  const result = await memberLogin(email, password);
  if (result === "error") hit(SIGN_IN_FAILURES, key);
  if (result === "ok") {
    clear(SIGN_IN_FAILURES, key);
    return { error: "", email, next: "/membership/dashboard" };
  }
  return { error: result, email };
}

export type ForgotState = { status: "" | "sent" | "failed" | "invalid"; email: string };

export async function requestReset(prev: ForgotState, form: FormData): Promise<ForgotState> {
  const email = String(form.get("txtemail") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: "invalid", email };

  // At most a few reset emails per address; past that the page answers as
  // usual but sends nothing, so it cannot be used to flood someone's inbox.
  if (!take(RESET_EMAILS, email)) return { status: "sent", email };
  const token = await createResetToken(email);
  // The same answer whether or not the address is registered, so this page
  // cannot be used to find out who is a member.
  if (token === null) return { status: "sent", email };
  if (token === "error") return { status: "failed", email };

  const link = absoluteUrl(`membership/reset-password?id=${encodeURIComponent(token.id)}&code=${token.code}`);
  const sent = await sendPasswordReset(email, link);
  return { status: sent ? "sent" : "failed", email };
}

export type ResetState = { state: "form" | "invalid" | "done"; error: string };

export async function chooseNewPassword(prev: ResetState, form: FormData): Promise<ResetState> {
  const id = String(form.get("id") ?? "");
  const code = String(form.get("code") ?? "");
  const pass = String(form.get("pass") ?? "");
  const cpass = String(form.get("confirm-pass") ?? "");

  const valid = await resetLinkValid(id, code);
  if (valid !== true) return { state: "invalid", error: "" };
  if (pass.length < 8) return { state: "form", error: "Please choose a password of at least 8 characters." };
  if (cpass !== pass) return { state: "form", error: "The two passwords do not match." };

  // The link is used up by replacing its token, so it cannot be used twice.
  return (await resetPassword(id, code, pass)) ? { state: "done", error: "" } : { state: "invalid", error: "" };
}
