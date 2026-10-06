"use server";

import { take, type Limit } from "@ihern/core/ratelimit";
import { readSession } from "@/lib/auth";
import { clientIp } from "@/lib/request";
import { memberByEmail, memberByEmailAndPhone, memberByNumber, recordCheck, type CheckMethod, type ConfirmedMember } from "@/lib/iherc";

/**
 * The registration page's member check: is this person an IHERN member, so
 * they may pay the member rate? Three ways, as the page offers them:
 *
 *   signed in          their IHERN account's email is an active member
 *   email + phone      both match one active member
 *   membership number  an active member has it; only their name and number
 *                      are returned (a number alone must not reveal someone's
 *                      email or phone)
 *
 * The lookups by email + phone and by number are limited per IP address, so
 * the member list cannot be searched by trying numbers.
 */

export type ConfirmResult =
  | { ok: true; member: ConfirmedMember; method: CheckMethod }
  | { ok: false; error: string; signedIn?: string };

const LOOKUPS: Limit = { name: "iherc-member-check", max: 20, windowMs: 15 * 60 * 1000 };
const TOO_MANY = "Too many tries. Please wait a few minutes, or sign in with your IHERN account instead.";
const UNAVAILABLE = "The member list could not be checked just now. Please try again shortly.";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function confirmed(member: ConfirmedMember, method: CheckMethod): Promise<ConfirmResult> {
  // Noting the check must never stop someone registering.
  await recordCheck(member, method).catch(() => undefined);
  return { ok: true, member, method };
}

/** The signed-in IHERN account, when it belongs to a member. */
export async function confirmSignedInAction(): Promise<ConfirmResult> {
  const session = await readSession();
  if (!session) return { ok: false, error: "" };
  const member = await memberByEmail(session.email);
  if (member === "error") return { ok: false, error: UNAVAILABLE, signedIn: session.email };
  if (!member) {
    return {
      ok: false,
      signedIn: session.email,
      error: `You are signed in as ${session.email}, which is not an active IHERN membership. If you joined IHERN with another email address, use your membership number or that email address below.`,
    };
  }
  return confirmed(member, "account");
}

export async function confirmByNumberAction(number: string): Promise<ConfirmResult> {
  const value = String(number ?? "").trim().slice(0, 40);
  if (!value) return { ok: false, error: "Please enter your membership number." };
  if (!take(LOOKUPS, await clientIp())) return { ok: false, error: TOO_MANY };
  const member = await memberByNumber(value);
  if (member === "error") return { ok: false, error: UNAVAILABLE };
  if (!member) {
    return {
      ok: false,
      error: `“${value}” is not an active IHERN membership number. It looks like IHERN/2026-1007 or IHERN/2025-123, and is in your membership confirmation email and under My membership.`,
    };
  }
  return confirmed(member, "number");
}

export async function confirmByEmailAndPhoneAction(email: string, phone: string): Promise<ConfirmResult> {
  const e = String(email ?? "").trim().toLowerCase().slice(0, 190);
  const p = String(phone ?? "").trim().slice(0, 40);
  if (!EMAIL.test(e)) return { ok: false, error: "Please enter the email address you joined IHERN with." };
  if (p.replace(/\D/g, "").length < 6) return { ok: false, error: "Please enter the mobile number you joined IHERN with." };
  if (!take(LOOKUPS, await clientIp())) return { ok: false, error: TOO_MANY };
  const member = await memberByEmailAndPhone(e, p);
  if (member === "error") return { ok: false, error: UNAVAILABLE };
  if (!member) return { ok: false, error: "No active IHERN membership has this email address and mobile number together. Please check both, or use your membership number." };
  return confirmed(member, "email-phone");
}
