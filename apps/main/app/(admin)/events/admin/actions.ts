"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { EVENTS_TAG } from "@ihern/core/cached";
import { absoluteUrl } from "@ihern/core/env";
import { eventDate, eventTime, eventVenue, linkNote, speakerLines, type EventLink, type EventMode, type IhernEvent } from "@ihern/core/events";
import { sendAdminAccessGranted, sendEventAnnouncements } from "@ihern/core/mail";
import { activeMember, MEMBERSHIP_UNREADABLE, NOT_A_MEMBER } from "@ihern/core/roles";
import {
  activeMembers,
  addEventEditor,
  claimAnnouncement,
  deleteEvent,
  duplicateEvent,
  EVENT_FILE_MAX,
  eventFileType,
  getEvent,
  listEventEditors,
  recordAnnouncementProgress,
  removeEventEditor,
  saveEvent,
  setEventEditorActive,
  setEventStatus,
  storeEventFile,
} from "@/lib/events";
import { NotAllowed, requireEventsUser, type EventsUser } from "@/lib/events-admin";

/** Everything the events admin changes. Every action checks the caller first. */

export type ActionResult = { ok: boolean; message: string; error: string; id?: number };
const done = (message: string, id?: number): ActionResult => ({ ok: true, message, error: "", id });
const failed = (error: string): ActionResult => ({ ok: false, message: "", error });
const UNAVAILABLE = "The database could not be reached. Please try again shortly.";

async function guard(fn: (who: EventsUser) => Promise<ActionResult>, role: "editor" | "admin" = "editor"): Promise<ActionResult> {
  try {
    return await fn(await requireEventsUser(role));
  } catch (e) {
    if (e instanceof NotAllowed) return failed(e.message);
    // redirect() and notFound() work by throwing: let them through.
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error("[events admin]", (e as Error).message);
    return failed("Something went wrong. Please try again.");
  }
}

/** The website's Events section and this admin's pages. */
function refresh() {
  revalidateTag(EVENTS_TAG);
  revalidatePath("/events/admin", "layout");
}

/** "2026-06-29T10:30" (datetime-local) -> "2026-06-29 10:30:00"; "" -> null. */
function toDbDate(v: string): string | null | "invalid" {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(v);
  return m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6] ?? "00"}` : "invalid";
}

/** A web address, or an address on this site ("/IHERN Poster.pdf"). Adds https:// to "example.org/x". */
function cleanUrl(v: string): string | null {
  const s = v.trim();
  if (!s) return "";
  if (s.startsWith("/")) return s.startsWith("//") || /[<>"\\]/.test(s) ? null : s;
  const withScheme = /^https?:\/\//i.test(s) ? s : /^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(s) ? `https://${s}` : "";
  try {
    const u = new URL(withScheme);
    return /^https?:$/.test(u.protocol) && u.hostname ? withScheme : null;
  } catch {
    return null;
  }
}

/** A link as the email shows it: absolute, with what kind of file it is. */
const mailLink = (l: EventLink): EventLink => {
  const url = l.url.startsWith("/") ? absoluteUrl(encodeURI(l.url)) : l.url;
  const note = linkNote(l.url);
  return { label: note ? `${l.label} (${note})` : l.label, url };
};

/**
 * Emails every active member about a published event, once. Sending runs
 * after the response (hundreds of messages take minutes); the event records
 * how many have gone, which the admin shows.
 */
async function announce(ev: IhernEvent): Promise<number | null | "unavailable"> {
  if (ev.status !== "published") return null;
  const members = await activeMembers();
  if (members === null) return "unavailable";
  if (!(await claimAnnouncement(ev.id, members.length))) return null;
  const links = [...(ev.joinUrl ? [{ label: ev.joinLabel || "Join", url: ev.joinUrl }] : []), ...ev.links].map(mailLink);
  const mail = {
    tag: ev.tag,
    title: ev.title,
    when: [eventDate(ev.startsAt), eventTime(ev.startsAt, ev.endsAt)].filter(Boolean).join(", "),
    venue: eventVenue(ev),
    description: ev.description,
    speakers: speakerLines(ev.speakers),
    links,
    page: absoluteUrl(`events#event-${ev.id}`),
  };
  after(async () => {
    const sent = await sendEventAnnouncements(members, mail, (n) => recordAnnouncementProgress(ev.id, n));
    console.log(`[events] "${ev.title}": emailed ${sent} of ${members.length} members`);
  });
  return members.length;
}

/* ---------------- events ---------------- */

export async function saveEventAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async (who) => {
    const field = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
    const idRaw = field("event_id", 12);
    const id = /^\d+$/.test(idRaw) ? Number(idRaw) : null;
    const existing = id ? await getEvent(id) : null;
    if (existing === "error") return failed(UNAVAILABLE);
    if (id && !existing) return failed("This event no longer exists.");

    const title = field("title", 300);
    const description = String(form.get("description") ?? "").trim().slice(0, 20000);
    const startsAt = toDbDate(field("starts_at", 20));
    const endsAt = toDbDate(field("ends_at", 20));
    const mode = (["online", "in-person", "hybrid"].includes(field("mode", 20)) ? field("mode", 20) : "online") as EventMode;
    const joinUrl = cleanUrl(field("join_url", 1000));
    const problems: string[] = [];
    if (!title) problems.push("Please give the event a title.");
    if (!description) problems.push("Please describe the event.");
    if (startsAt === "invalid" || endsAt === "invalid") problems.push("The date and time are not valid.");
    else if (!startsAt) problems.push("Please enter when the event starts.");
    else if (endsAt && endsAt < startsAt) problems.push("The event ends before it starts.");
    if (joinUrl === null) problems.push("The joining link is not a web address.");

    // The links: label + address rows, then an uploaded file.
    const labels = form.getAll("link_label").map((v) => String(v).trim().slice(0, 100));
    const urls = form.getAll("link_url").map((v) => String(v).trim().slice(0, 1000));
    const links: EventLink[] = [];
    urls.forEach((raw, i) => {
      if (!raw) return;
      const url = cleanUrl(raw);
      if (url === null) problems.push(`“${raw}” is not a web address.`);
      else links.push({ label: labels[i] || "Link", url });
    });
    if (problems.length) return failed(problems.join(" "));

    const file = form.get("attach");
    if (file instanceof File && file.size > 0) {
      if (file.size > EVENT_FILE_MAX) return failed("The file is larger than 10 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const ext = eventFileType(bytes);
      if (!ext) return failed("The file must be a PDF, JPEG or PNG.");
      const url = await storeEventFile(bytes, ext, file.name);
      if (!url) return failed("The file could not be stored. Please try again.");
      links.push({ label: field("attach_label", 100) || (ext === "pdf" ? "View poster" : "View image"), url });
    }

    const intent = field("intent", 10);
    const status = intent === "publish" ? "published" : intent === "draft" ? "draft" : existing ? existing.status : "draft";
    const saved = await saveEvent(
      id,
      {
        tag: field("tag", 100),
        title,
        description,
        speakers: String(form.get("speakers") ?? "").trim().slice(0, 5000),
        startsAt: startsAt as string,
        endsAt: endsAt as string | null,
        venue: field("venue", 300),
        mode,
        joinUrl: joinUrl as string,
        joinLabel: field("join_label", 100),
        links,
        status,
      },
      who.email
    );
    if (!saved) return failed("It could not be saved just now. Please try again.");
    refresh();

    let message = status === "published" ? (existing?.status === "published" ? "Updated." : "Published: it is on the website now.") : "Draft saved.";
    if (status === "published" && form.get("notify") === "1") {
      const ev = await getEvent(saved);
      const n = ev && ev !== "error" ? await announce(ev) : "unavailable";
      if (n === "unavailable") message += " The members could not be emailed just now: use Email members later.";
      else if (n !== null) message += ` Emailing ${n} members now.`;
    }
    return done(message, saved);
  });
}

export async function announceEventAction(id: number): Promise<ActionResult> {
  return guard(async () => {
    const ev = await getEvent(id);
    if (ev === "error") return failed(UNAVAILABLE);
    if (!ev) return failed("This event no longer exists.");
    const n = await announce(ev);
    if (n === "unavailable") return failed("The membership database could not be reached.");
    if (n === null) return failed(ev.status !== "published" ? "Publish the event first." : "The members have already been emailed about this event.");
    refresh();
    return done(`Emailing ${n} members now.`);
  });
}

export async function setEventStatusAction(id: number, status: "draft" | "published" | "trash"): Promise<ActionResult> {
  return guard(async () => {
    if (!(await setEventStatus(id, status))) return failed("Could not change it just now.");
    refresh();
    return done(status === "published" ? "Published." : status === "trash" ? "Moved to the trash." : "Taken off the website (now a draft).");
  });
}

export async function deleteEventAction(id: number): Promise<ActionResult> {
  return guard(async () => {
    if (!(await deleteEvent(id))) return failed("Move it to the trash first.");
    refresh();
    return done("Deleted permanently.");
  });
}

export async function duplicateEventAction(id: number): Promise<ActionResult> {
  const res = await guard(async (who) => {
    const copy = await duplicateEvent(id, who.email);
    if (!copy) return failed("Could not copy it just now.");
    refresh();
    return done("Copied.", copy);
  });
  if (res.ok && res.id) redirect(`/events/admin/${res.id}?copied=1`);
  return res;
}

/* ---------------- who may use it (admins) ---------------- */

/** Gives an IHERN member access, and emails them about it (the first time only). */
export async function addEventEditorAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async (me) => {
    const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 190);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return failed("Please enter a valid email address.");
    const member = await activeMember(email);
    if (member === "unavailable") return failed(MEMBERSHIP_UNREADABLE);
    if (!member) return failed(NOT_A_MEMBER);
    const role = form.get("role") === "admin" ? "admin" : "editor";
    const res = await addEventEditor(email, role);
    if (!res) return failed(UNAVAILABLE);
    refresh();
    const as = role === "admin" ? "an admin" : "an editor";
    if (res === "updated") return done(`${email} can use the events admin as ${as}.`);
    const mailed = await sendAdminAccessGranted(email, member.name, "IHERN events admin", role, absoluteUrl("events/admin"), me.name || me.email);
    return done(`${email} can now use the events admin as ${as}. ${mailed ? "They have been emailed about it." : "The email to tell them could not be sent: please let them know."}`);
  }, "admin");
}

/** Deactivate (kept on the list, no access) or activate again. No email either way. */
export async function setEventEditorActiveAction(id: number, active: boolean): Promise<ActionResult> {
  return guard(async (me) => {
    const target = ((await listEventEditors()) ?? []).find((e) => e.id === id);
    if (!target) return failed("Already removed.");
    if (target.email === me.email.toLowerCase()) return failed("You cannot change your own access.");
    if (!(await setEventEditorActive(id, active))) return failed("Could not change it just now.");
    refresh();
    return done(active ? `${target.email} is active again.` : `${target.email} is deactivated.`);
  }, "admin");
}

export async function removeEventEditorAction(id: number): Promise<ActionResult> {
  return guard(async (me) => {
    const all = (await listEventEditors()) ?? [];
    const target = all.find((e) => e.id === id);
    if (!target) return failed("Already removed.");
    if (target.email === me.email.toLowerCase()) return failed("You cannot remove yourself.");
    if (!(await removeEventEditor(id))) return failed("Could not remove it just now.");
    refresh();
    return done(`${target.email} removed.`);
  }, "admin");
}
