"use server";

import { revalidateTag } from "next/cache";
import { MEMBERS_TAG } from "@ihern/core/cached";
import { currentMember, imageType, POSITIONS, removePhoto, storePhoto, TITLES, updateOwnDetails } from "@/lib/membership";
import { setMemberPhoto } from "@/lib/admin";
import { completeUpdateRequest, readUpdateToken } from "@/lib/profile-update";

/** A member updating their own details: from an emailed request link (`token`), or signed in. */

export type ProfileState = { seq: number; errors: string[]; done: boolean };

const MAX_PHOTO = 5 * 1024 * 1024;
const UNAVAILABLE = "Your details could not be saved just now. Please try again in a few minutes, or email ihern@iiitd.ac.in.";

function validUrl(v: string): boolean {
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : "https://" + v);
    return /^https?:$/.test(url.protocol) && url.hostname !== "" && !/\s/.test(v);
  } catch {
    return false;
  }
}

export async function updateProfileAction(token: string, prev: ProfileState, form: FormData): Promise<ProfileState> {
  const errors: string[] = [];
  const result = (): ProfileState => ({ seq: prev.seq + 1, errors, done: false });

  let id: number | null = null;
  if (token) {
    const t = await readUpdateToken(token);
    if (t === "unavailable") return { ...result(), errors: [UNAVAILABLE] };
    if (t === null) return { ...result(), errors: ["This link has expired or has already been used. Please sign in as a member to update your details."] };
    id = t;
  } else {
    const m = await currentMember();
    if (m === "unavailable") return { ...result(), errors: [UNAVAILABLE] };
    if (!m) return { ...result(), errors: ["Your member sign-in has ended. Please sign in again."] };
    id = Number(m.studentID);
  }

  const field = (k: string) => String(form.get(k) ?? "").trim();
  const title = field("title");
  const name = field("studentName");
  const mobile = field("studentMobile");
  const position = field("yourTitle");
  const other = field("anyothervalue");
  let url = field("url");
  if (!(TITLES as readonly string[]).includes(title)) errors.push("Please choose a title.");
  if (!name || Array.from(name).length > 90) errors.push("Please enter your name (up to 90 characters).");
  if (!/^\+?[0-9][0-9 \-]{6,18}$/.test(mobile)) errors.push("Please enter a valid mobile number.");
  if (!field("areasofinterest")) errors.push("Please enter your department.");
  if (!(POSITIONS as readonly string[]).includes(position)) errors.push("Please choose your position.");
  if (position === "Any other" && !other) errors.push("Please describe your position.");
  if (!field("areasofinteresthe")) errors.push("Please list your areas of research interest.");
  if (url && !validUrl(url)) errors.push("The homepage link does not look like a web address.");
  if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;

  const upload = form.get("photo");
  let bytes: Uint8Array | null = null;
  let ext: "jpg" | "png" | null = null;
  if (upload instanceof File && upload.size > 0) {
    bytes = new Uint8Array(await upload.arrayBuffer());
    ext = imageType(bytes);
    if (!ext) errors.push("The photograph must be a JPEG or PNG image.");
    else if (upload.size > MAX_PHOTO) errors.push("The photograph must be smaller than 5 MB.");
  }
  if (errors.length) return result();

  const saved = await updateOwnDetails(id, {
    studentName: `${title} ${name}`.slice(0, 100),
    studentMobile: mobile.slice(0, 50),
    institutionName: field("institutionName").slice(0, 200),
    areasofinterest: field("areasofinterest").slice(0, 5000),
    areasofinteresthe: field("areasofinteresthe").slice(0, 5000),
    yourTitle: (position === "Any other" ? other : position).slice(0, 150),
    url: url.slice(0, 255),
  });
  if (!saved) return { ...result(), errors: [UNAVAILABLE] };

  if (bytes && ext) {
    const stored = await storePhoto(bytes, ext, mobile || String(id));
    if (!stored || !(await setMemberPhoto(id, stored))) {
      if (stored) await removePhoto(stored);
      return { ...result(), errors: ["Your details are saved, but the photograph could not be saved. Please try it again."] };
    }
  } else if (form.get("removePhoto") === "1") {
    await setMemberPhoto(id, null);
  }

  // A request waiting for this member is answered, however they came in.
  await completeUpdateRequest(id);
  revalidateTag(MEMBERS_TAG);
  return { seq: prev.seq + 1, errors: [], done: true };
}
