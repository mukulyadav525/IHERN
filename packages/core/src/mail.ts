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

let cached: Transporter | null = null;
function transport(): Transporter {
  if (cached) return cached;
  const port = Number(process.env.IHERN_SMTP_PORT || 587);
  cached = nodemailer.createTransport({
    host: process.env.IHERN_SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.IHERN_SMTP_USER
      ? { user: process.env.IHERN_SMTP_USER, pass: process.env.IHERN_SMTP_PASS || "" }
      : undefined,
  });
  return cached;
}

async function send(msg: Message): Promise<boolean> {
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
    await transport().sendMail({
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
