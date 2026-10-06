import nodemailer, { type Transporter } from "nodemailer";
import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { absoluteUrl } from "./env";

/**
 * Outgoing mail - the four messages the PHP site sends, with the same wording:
 *
 *   subscription confirmation   ihern_subscription_send_confirmation()
 *   new post on the blog        ihern_blog_notify_subscribers()
 *   membership confirmation     applications/register.php
 *   password reset link         applications/forgotPassword.php
 *
 * and the ones the new admin areas send: a new event to every member, an
 * invitation to the membership admin, "please update your details" to a
 * member, and "please subscribe" to people not subscribed to the blog.
 * Messages to many people go one at a time over one connection (sendMany).
 *
 * Configured with IHERN_SMTP_HOST / _PORT / _USER / _PASS (see .env.example).
 * Every send is best-effort: a mail failure never fails the action that
 * triggered it, and the caller is told whether the message went.
 *
 * IHERN_MAIL_TRANSPORT=file writes messages to .data/mail.log instead of
 * sending them - for local testing, where no real mail must go out.
 */

type Message = { to: string; subject: string; text?: string; html?: string; from?: string; replyTo?: string };

// Every message comes from, and replies go to, the IHERN mailbox.
const IHERN_MAILBOX = "ihern@iiitd.ac.in";
const BLOG_FROM = `IHERN Blog <${IHERN_MAILBOX}>`;
const MEMBERSHIP_FROM = `IHERN <${IHERN_MAILBOX}>`;

function fileMode(): boolean {
  return (process.env.IHERN_MAIL_TRANSPORT || "").toLowerCase() === "file";
}

export function mailConfigured(): boolean {
  return fileMode() || Boolean(process.env.IHERN_SMTP_HOST);
}

function smtpOptions() {
  const port = Number(process.env.IHERN_SMTP_PORT || 587);
  // Through a tunnel (IHERN_SMTP_HOST=127.0.0.1 forwarded to smtp.gmail.com:465):
  // IHERN_SMTP_SECURE=1 and IHERN_SMTP_TLS_SERVERNAME=smtp.gmail.com, so the
  // connection is still encrypted and checked against Gmail's certificate.
  const servername = process.env.IHERN_SMTP_TLS_SERVERNAME || undefined;
  return {
    host: process.env.IHERN_SMTP_HOST,
    port,
    secure: port === 465 || process.env.IHERN_SMTP_SECURE === "1",
    tls: servername ? { servername } : undefined,
    auth: process.env.IHERN_SMTP_USER
      ? { user: process.env.IHERN_SMTP_USER, pass: process.env.IHERN_SMTP_PASS || "" }
      : undefined,
  };
}

let cached: Transporter | null = null;
function transport(): Transporter {
  if (!cached) cached = nodemailer.createTransport(smtpOptions());
  return cached;
}

async function send(msg: Message, via?: Transporter): Promise<boolean> {
  if (!mailConfigured()) {
    console.warn(`[IHERN mail] not configured - skipped "${msg.subject}"`);
    return false;
  }
  try {
    if (fileMode()) {
      const dir = path.join(process.cwd(), ".data");
      await mkdir(dir, { recursive: true });
      await appendFile(path.join(dir, "mail.log"), JSON.stringify({ at: new Date().toISOString(), ...msg }) + "\n");
      return true;
    }
    await (via ?? transport()).sendMail({
      from: process.env.IHERN_MAIL_FROM || msg.from,
      to: msg.to,
      replyTo: msg.replyTo,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
    return true;
  } catch (e) {
    console.error(`[IHERN mail] "${msg.subject}" failed:`, e);
    return false;
  }
}

/**
 * Many messages, one at a time over one kept-open connection (a mail server
 * refuses hundreds of connections at once). `progress` is told the running
 * count of messages sent. Returns how many went.
 */
async function sendMany(messages: Message[], progress?: (sent: number) => unknown): Promise<number> {
  if (!messages.length) return 0;
  const pool = !fileMode() && mailConfigured() ? nodemailer.createTransport({ ...smtpOptions(), pool: true, maxConnections: 1, maxMessages: 200 }) : undefined;
  let sent = 0;
  try {
    for (const m of messages) {
      if (!EMAIL.test(m.to)) continue;
      if (await send(m, pool)) {
        sent++;
        // Every 10 messages is often enough for a progress count.
        if (progress && (sent % 10 === 0 || sent === messages.length)) await progress(sent);
      }
    }
  } finally {
    pool?.close();
  }
  if (progress) await progress(sent);
  return sent;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIGNATURE = "— IHERN\nIndia Higher Education Research Network\nihern@iiitd.ac.in\n";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

/** Confirmation of a new blog subscription, to the address on the account. */
export function sendSubscriptionConfirmation(name: string, email: string): Promise<boolean> {
  return send({
    to: email,
    from: BLOG_FROM,
    replyTo: IHERN_MAILBOX,
    subject: "You are subscribed to the IHERN Blog",
    text:
      `Hi ${firstName(name)},\n\n` +
      `You are now subscribed to the IHERN Blog with your IHERN account (${email}).\n` +
      "New posts from the India Higher Education Research Network will reach you here.\n\n" +
      "Manage your subscription any time from My account on the IHERN website.\n\n" +
      "— IHERN Blog\n" +
      "India Higher Education Research Network\n",
  });
}

/** One message per active subscriber about a newly published post. Returns how many went. */
export async function sendNewPostNotifications(
  subscribers: { name: string; email: string }[],
  title: string,
  url: string
): Promise<number> {
  const clean = title.replace(/[\r\n]+/g, " ").trim();
  const manage = absoluteUrl("account");
  let sent = 0;
  for (const s of subscribers) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) continue;
    const ok = await send({
      to: s.email,
      from: BLOG_FROM,
      replyTo: IHERN_MAILBOX,
      subject: "New on the IHERN Blog: " + clean,
      text:
        `Hi ${firstName(s.name)},\n\n` +
        "A new post has been published on the IHERN Blog:\n\n" +
        `${clean}\n${url}\n\n` +
        "You are receiving this because you subscribed with your IHERN account.\n" +
        `Manage or cancel your subscription: ${manage}\n\n` +
        "— IHERN Blog\n" +
        "India Higher Education Research Network\n",
    });
    if (ok) sent++;
  }
  return sent;
}

/** "Welcome to IHERN" with the membership number, as register.php sends it. */
export function sendMembershipConfirmation(name: string, email: string, number: string): Promise<boolean> {
  return send({
    to: email,
    from: MEMBERSHIP_FROM,
    replyTo: IHERN_MAILBOX,
    subject: "Membership Confirmation for IHERN",
    html:
      `Hello ${esc(name)},<br /><br />Welcome to IHERN!<br/>` +
      `Your membership number is - ${esc(number)}<br /><br/>Thanks, IHERN Team`,
  });
}

/** The password reset link, as forgotPassword.php sends it. */
export function sendPasswordReset(email: string, link: string): Promise<boolean> {
  return send({
    to: email,
    from: MEMBERSHIP_FROM,
    replyTo: IHERN_MAILBOX,
    subject: "Password Reset",
    html:
      `Dear ${esc(email)},<br /><br />We received your request to reset the password, just click the following ` +
      `link to reset your password, if not just ignore this email,<br /><br />` +
      `<a href='${esc(link)}'>Click here to reset your password</a><br /><br />Thank You`,
  });
}

/** Tells the blog's editors that a comment is waiting for approval. */
export async function sendCommentForModeration(to: string[], postTitle: string, author: string, comment: string, adminUrl: string): Promise<void> {
  const excerpt = comment.length > 600 ? comment.slice(0, 600) + "…" : comment;
  for (const email of to) {
    await send({
      to: email,
      from: BLOG_FROM,
      replyTo: IHERN_MAILBOX,
      subject: `Comment awaiting approval: ${postTitle.replace(/[\r\n]+/g, " ")}`,
      text:
        `A new comment on "${postTitle}" is waiting for approval.\n\n` +
        `From: ${author}\n\n${excerpt}\n\n` +
        `Approve or remove it: ${adminUrl}\n\n` +
        "— IHERN Blog\n",
    });
  }
}

/* ---------------------------------------------------------------- the admin areas */

/** An event as the announcement shows it (formatted by the caller). */
export type EventMail = {
  tag: string;
  title: string;
  when: string;
  venue: string;
  description: string;
  speakers: string[];
  links: { label: string; url: string }[];
  /** the events page on the website */
  page: string;
};

/** A newly published event, to every member. Returns how many went. */
export function sendEventAnnouncements(members: { name: string; email: string }[], ev: EventMail, progress?: (sent: number) => unknown): Promise<number> {
  const title = ev.title.replace(/[\r\n]+/g, " ").trim();
  const body =
    `${ev.tag ? ev.tag + ": " : ""}${title}\n\n` +
    (ev.when ? `When: ${ev.when}\n` : "") +
    (ev.venue ? `Where: ${ev.venue}\n` : "") +
    `\n${ev.description.trim()}\n` +
    (ev.speakers.length ? `\nSpeakers\n${ev.speakers.join("\n")}\n` : "") +
    (ev.links.length ? `\n${ev.links.map((l) => `${l.label}: ${l.url}`).join("\n")}\n` : "") +
    `\nAll IHERN events: ${ev.page}\n\n` +
    "You are receiving this as a member of IHERN.\n\n" +
    SIGNATURE;
  return sendMany(
    members.map((m) => ({
      to: m.email,
      from: MEMBERSHIP_FROM,
      replyTo: IHERN_MAILBOX,
      subject: `IHERN event: ${title}`,
      text: `Dear ${firstName(m.name)},\n\nYou are invited to an IHERN event.\n\n${body}`,
    })),
    progress
  );
}

/** An invitation to the membership admin: the link signs the invited address in to it. */
export function sendAdminInvitation(email: string, invitedBy: string, link: string): Promise<boolean> {
  return send({
    to: email,
    from: MEMBERSHIP_FROM,
    replyTo: IHERN_MAILBOX,
    subject: "You are invited to the IHERN membership admin",
    text:
      "Hello,\n\n" +
      `${invitedBy} has given ${email} access to the IHERN membership admin, where IHERN's members are managed.\n\n` +
      `Accept the invitation (the link works for 7 days):\n${link}\n\n` +
      "You will sign in with your IHERN account for this email address, or set one up from the link. No separate admin password is needed.\n\n" +
      "If you were not expecting this, you can ignore this email.\n\n" +
      SIGNATURE,
  });
}

/** "Please check and update your IHERN details", one link per member. Returns how many went. */
export function sendProfileUpdateRequests(members: { name: string; email: string; link: string }[], progress?: (sent: number) => unknown): Promise<number> {
  return sendMany(
    members.map((m) => ({
      to: m.email,
      from: MEMBERSHIP_FROM,
      replyTo: IHERN_MAILBOX,
      subject: "Please update your IHERN membership details",
      text:
        `Dear ${firstName(m.name)},\n\n` +
        "IHERN is updating its member records. Please take a moment to check your membership details - your position, " +
        "organisation, research interests and photograph - and update anything that has changed.\n\n" +
        `Your details (the link works for 14 days, no password needed):\n${m.link}\n\n` +
        "Thank you for being a part of IHERN.\n\n" +
        SIGNATURE,
    })),
    progress
  );
}

/** "Subscribe to the IHERN Blog", to people who are not subscribed. Returns how many went. */
export function sendSubscribeNudges(people: { name: string; email: string }[], links: { subscribe: string; reset: string }, progress?: (sent: number) => unknown): Promise<number> {
  return sendMany(
    people.map((p) => ({
      to: p.email,
      from: BLOG_FROM,
      replyTo: IHERN_MAILBOX,
      subject: "Subscribe to the IHERN Blog",
      text:
        `Dear ${firstName(p.name)},\n\n` +
        "The IHERN Blog publishes writing on higher education research in India from IHERN's members and friends. " +
        "Subscribe, and new posts will reach you by email.\n\n" +
        `Subscribe: ${links.subscribe}\n\n` +
        "Sign in with your IHERN account (members: the email address you joined with). If you joined IHERN before " +
        `5 October 2026, please first set a password for the new website: ${links.reset}\n\n` +
        "You can cancel the subscription any time from My account.\n\n" +
        "— IHERN Blog\nIndia Higher Education Research Network\n",
    })),
    progress
  );
}

/**
 * "You now have access to the <area>": to someone just given access to the
 * blog admin or the events admin. (The membership admin sends its invitation
 * instead.) Nothing is sent when access is taken away.
 */
export function sendAdminAccessGranted(email: string, name: string, area: string, role: string, link: string, givenBy: string): Promise<boolean> {
  return send({
    to: email,
    from: MEMBERSHIP_FROM,
    replyTo: IHERN_MAILBOX,
    subject: `You now have access to the ${area}`,
    text:
      `Dear ${firstName(name)},\n\n` +
      `${givenBy} has given you access to the ${area} as ${/^[aeiou]/i.test(role) ? "an" : "a"} ${role}.\n\n` +
      `Open it here:\n${link}\n\n` +
      `Sign in with your IHERN account for ${email}: your IHERN membership email address and password. If you joined IHERN ` +
      `before 5 October 2026, please first set a password for the new website: ${absoluteUrl("membership/forgot-password")}\n\n` +
      "If you were not expecting this, please let us know by replying to this email.\n\n" +
      SIGNATURE,
  });
}

/** IHERC: a payment below the fee for the payer's category. */
export type IhercBalanceMail = { name: string; email: string; paid: string; due: string; balance: string; reason: string; ref: string; payLink: string; page: string };

/** "A balance is due on your IHERC registration": the reason, the amounts and how to pay. */
export function sendIhercBalanceRequest(m: IhercBalanceMail): Promise<boolean> {
  return send({
    to: m.email,
    from: MEMBERSHIP_FROM,
    replyTo: IHERN_MAILBOX,
    subject: "IHERC 2026 registration: balance due",
    text:
      `Dear ${firstName(m.name)},\n\n` +
      "Thank you for registering for the India Higher Education Research Conference (IHERC) 2026.\n\n" +
      `${m.reason}\n\n` +
      `Paid: ${m.paid}${m.ref ? ` (payment reference ${m.ref})` : ""}\n` +
      `Registration fee for your category: ${m.due}\n` +
      `Balance due: ${m.balance} (all amounts include 18% GST)\n\n` +
      `Please pay the balance using the IHERC 2026 payment form, entering ${m.balance} as the amount:\n${m.payLink}\n\n` +
      "If you are an IHERN member, please reply to this email with your membership number instead, and we will check it. " +
      `IHERN membership is free: ${m.page}\n\n` +
      SIGNATURE,
  });
}
