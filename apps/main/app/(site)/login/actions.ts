"use server";

import { safeReturn, startSession } from "@/lib/auth";
import { accountsAvailable, domainHint, emailDomainAllowed, normaliseEmail, verifyCredentials } from "@ihern/core/store";
import { allowed, clear, hit, SIGN_IN_FAILURES } from "@ihern/core/ratelimit";
import { linkAdminOnSignIn } from "@/lib/admin";

const TOO_MANY = "Too many unsuccessful attempts. Please wait 15 minutes and try again, or reset your password.";
/**
 * Sign in / create an account (blog-login.php's POST branch), with the same
 * checks in the same order and the same messages. Server actions carry Next's
 * own same-origin check, which stands in for the PHP form's CSRF token.
 */

export type AuthState = {
  mode: "login" | "register";
  error: string;
  email: string;
  name: string;
  /** Set on success: where to go next (a full navigation, so every part of the page sees the new session). */
  next?: string;
};

export async function authenticate(prev: AuthState, form: FormData): Promise<AuthState> {
  const mode: AuthState["mode"] = form.get("mode") === "register" ? "register" : "login";
  const email = normaliseEmail(String(form.get("email") ?? ""));
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const returnTo = safeReturn(String(form.get("return") ?? ""));
  const state = (error: string): AuthState => ({ mode, error, email, name });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return state("Please enter a valid email address.");
  if (!emailDomainAllowed(email)) return state(`That email address is not permitted. ${domainHint()}`.trim());
  if (!accountsAvailable()) return state("The account service is temporarily unavailable. Please try again shortly.");

  // Accounts are made by joining IHERN (/join), not by this short form.
  if (mode === "register") return state("Please join IHERN with the membership form to create an account.");

  if (!allowed(SIGN_IN_FAILURES, email)) return state(TOO_MANY);
  const result = await verifyCredentials(email, password);
  if (!result.ok) {
    if (result.reason === "unavailable") return state("Could not sign you in. Please try again.");
    hit(SIGN_IN_FAILURES, email);
    return state("Incorrect email or password.");
  }
  clear(SIGN_IN_FAILURES, email);
  await startSession(result.value.id, result.value.email, result.value.name);
  // A membership admin signing in with the admin password: the account opens the membership admin from now on.
  await linkAdminOnSignIn(result.value.id, result.value.email, password);
  return { ...state(""), next: returnTo };
}
