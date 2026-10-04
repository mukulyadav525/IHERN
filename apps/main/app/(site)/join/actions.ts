"use server";

import {
  emailRegistered,
  imageType,
  membershipAvailable,
  POSITIONS,
  registerMember,
  removePhoto,
  storePhoto,
  TITLES,
} from "@/lib/membership";
import { sendMembershipConfirmation } from "@ihern/core/mail";
import { take, SIGN_UPS } from "@ihern/core/ratelimit";
import { revalidateTag } from "next/cache";
import { MEMBERS_TAG } from "@ihern/core/cached";
import { clientIp } from "@/lib/request";
import { EMPTY_FIELDS, type JoinFields, type JoinState } from "./fields";

/**
 * The membership application (applications/register.php): the same fields,
 * the same checks and messages, the same row in ihern2024.studentregistration
 * and the same confirmation email with the membership number.
 */

const MAX_PHOTO = 5 * 1024 * 1024;

/**
 * Addresses whose registration is being saved right now. The email check and
 * the insert are separate steps, so two submissions racing each other (a
 * double click, a resubmitted form) could otherwise both pass the check.
 */
const inFlight = new Set<string>();

function validUrl(v: string): boolean {
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : "https://" + v);
    return /^https?:$/.test(url.protocol) && url.hostname !== "" && !/\s/.test(v);
  } catch {
    return false;
  }
}

export async function submitMembership(prev: JoinState, form: FormData): Promise<JoinState> {
  const field = (k: string) => String(form.get(k) ?? "").trim();
  const old: JoinFields = {
    title: field("title"),
    studentName: field("studentName"),
    studentEmail: field("studentEmail").toLowerCase(),
    studentMobile: field("studentMobile"),
    institutionName: field("institutionName"),
    areasofinterest: field("areasofinterest"),
    yourTitle: field("yourTitle"),
    anyothervalue: field("anyothervalue"),
    areasofinteresthe: field("areasofinteresthe"),
    url: field("url"),
  };
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm_password") ?? "");
  const errors: string[] = [];
  const result = (): JoinState => ({ seq: prev.seq + 1, errors, old, done: null });

  if (!(TITLES as readonly string[]).includes(old.title)) errors.push("Please choose a title.");
  if (old.studentName === "" || Array.from(old.studentName).length > 50) errors.push("Please enter your name (up to 50 characters).");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(old.studentEmail) || old.studentEmail.length > 50) errors.push("Please enter a valid email address.");
  if (!/^\+?[0-9][0-9 \-]{6,18}$/.test(old.studentMobile)) errors.push("Please enter a valid mobile number.");
  if (old.areasofinterest === "") errors.push("Please enter your department.");
  if (!(POSITIONS as readonly string[]).includes(old.yourTitle)) errors.push("Please choose your position.");
  if (old.yourTitle === "Any other" && old.anyothervalue === "") errors.push("Please describe your position.");
  if (old.areasofinteresthe === "") errors.push("Please list your areas of research interest.");
  if (old.url !== "" && !validUrl(old.url)) errors.push("The homepage link does not look like a web address.");
  if (password.length < 8) errors.push("Please choose a password of at least 8 characters.");
  else if (password !== confirm) errors.push("The two passwords do not match.");

  // Optional photograph: a real JPEG/PNG image, at most 5 MB, stored under a
  // generated name so nothing the visitor typed ends up in the file path.
  const upload = form.get("photo");
  let photoBytes: Uint8Array | null = null;
  let photoExt: "jpg" | "png" | null = null;
  if (upload instanceof File && upload.size > 0) {
    photoBytes = new Uint8Array(await upload.arrayBuffer());
    photoExt = imageType(photoBytes);
    if (!photoExt) errors.push("The photograph must be a JPEG or PNG image.");
    else if (upload.size > MAX_PHOTO) errors.push("The photograph must be smaller than 5 MB.");
  }

  if (!errors.length && !take(SIGN_UPS, await clientIp())) {
    errors.push("Too many registrations from this network just now. Please try again later, or email ihern@iiitd.ac.in.");
  }
  if (!errors.length && inFlight.has(old.studentEmail)) {
    errors.push("This registration is already being submitted. Please wait a moment.");
  }
  if (errors.length) return result();
  inFlight.add(old.studentEmail);
  try {
    return await register(prev, old, password, photoBytes, photoExt, errors, result);
  } finally {
    inFlight.delete(old.studentEmail);
  }
}

async function register(
  prev: JoinState,
  old: JoinFields,
  password: string,
  photoBytes: Uint8Array | null,
  photoExt: "jpg" | "png" | null,
  errors: string[],
  result: () => JoinState
): Promise<JoinState> {
  if (!membershipAvailable()) {
    errors.push("Your registration could not be saved just now. Please try again in a few minutes, or email ihern@iiitd.ac.in.");
    return result();
  }
  const exists = await emailRegistered(old.studentEmail);
  if (exists === null) {
    errors.push("Your registration could not be saved just now. Please try again in a few minutes, or email ihern@iiitd.ac.in.");
  } else if (exists) {
    errors.push("This email address is already registered with IHERN. Please use a different one, or sign in.");
  }

  let photo: string | null = null;
  if (!errors.length && photoBytes && photoExt) {
    photo = await storePhoto(photoBytes, photoExt, old.studentMobile);
    if (!photo) errors.push("Your photograph could not be saved. Please try again, or submit without it.");
  }

  if (errors.length) return result();

  const studentName = `${old.title} ${old.studentName}`;
  const saved = await registerMember({
    studentName,
    studentEmail: old.studentEmail,
    studentMobile: old.studentMobile,
    institutionName: old.institutionName,
    areasofinterest: old.areasofinterest,
    areasofinteresthe: old.areasofinteresthe,
    yourTitle: old.yourTitle === "Any other" ? old.anyothervalue : old.yourTitle,
    url: old.url,
    password,
    photo,
  });

  if (saved === null) {
    if (photo) await removePhoto(photo);
    errors.push("Your registration could not be saved just now. Please try again in a few minutes, or email ihern@iiitd.ac.in.");
    return result();
  }

  revalidateTag(MEMBERS_TAG);
  const { number } = saved;
  const mailed = await sendMembershipConfirmation(studentName, old.studentEmail, number);
  return { seq: prev.seq + 1, errors: [], old: EMPTY_FIELDS, done: { name: studentName, email: old.studentEmail, number, mailed } };
}
