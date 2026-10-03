"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content";
import { notifyMainSite } from "@/lib/session";
import {
  addEditor,
  addMedia,
  claimNotification,
  deleteAuthor,
  deleteComment,
  deleteMedia,
  deletePost,
  deleteTerm,
  ensureTerm,
  getPostById,
  listEditors,
  listMedia,
  removeEditor,
  saveAuthor,
  savePost,
  setCommentStatus,
  setPostStatus,
  uniqueSlug,
  updateMediaAlt,
  updateTerm,
  type Media,
  type PostType,
} from "@ihern/core/blog";
import { postUrl } from "@ihern/core/blog-paths";
import { query } from "@ihern/core/db";
import { sanitizePostHtml } from "@ihern/core/html";
import { sendNewPostNotifications } from "@ihern/core/mail";
import { activeSubscribers } from "@ihern/core/store";
import { slugify } from "@ihern/core/text";
import { NotAllowed, requireEditor } from "@/lib/admin";
import { MAX_UPLOAD, removeUpload, sniff, storeUpload, TYPES } from "@/lib/uploads";

/**
 * Everything the admin area changes. Each action checks that the caller is
 * an editor (admins only for managing editors) before doing anything.
 */

export type ActionResult = { ok: boolean; message: string; error: string; id?: number };
const done = (message: string, id?: number): ActionResult => ({ ok: true, message, error: "", id });
const failed = (error: string): ActionResult => ({ ok: false, message: "", error });

async function guard<T>(fn: () => Promise<T>, role: "editor" | "admin" = "editor"): Promise<T | ActionResult> {
  try {
    await requireEditor(role);
    return await fn();
  } catch (e) {
    if (e instanceof NotAllowed) return failed(e.message);
    throw e;
  }
}

/**
 * After any change to content: the cached content (lib/content.ts), every
 * page, and the main site's Blogs page.
 */
async function refreshBlog() {
  revalidateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
  await notifyMainSite();
}

/* ---------------------------------------------------------------- posts and pages */

/** "2026-06-29T10:30" (datetime-local) -> "2026-06-29 10:30:00"; "" -> null. */
function toDbDate(v: string): string | null | "invalid" {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(v);
  return m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6] ?? "00"}` : "invalid";
}

function nowIst(): string {
  const d = new Date(Date.now() + 5.5 * 3600 * 1000);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/** Emails active subscribers about a post, once (the first time it is published). */
async function announce(id: number): Promise<number | null> {
  const post = await getPostById(id);
  if (!post || post.type !== "post" || post.status !== "published" || !post.publishedAt || post.publishedAt > nowIst()) return null;
  if (!(await claimNotification(id))) return null;
  const subs = (await activeSubscribers()) ?? [];
  return sendNewPostNotifications(subs, post.title, postUrl(post));
}

export async function savePostAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const field = (k: string) => String(form.get(k) ?? "").trim();
    const idRaw = field("post_id");
    const id = /^\d+$/.test(idRaw) ? Number(idRaw) : null;
    const type: PostType = field("type") === "page" ? "page" : "post";
    const intent = field("intent"); // "draft" | "publish"
    const title = field("title");
    if (!title) return failed("Please give it a title.");

    const existing = id ? await getPostById(id) : null;
    if (id && !existing) return failed("That post no longer exists.");

    const date = toDbDate(field("published_at"));
    if (date === "invalid") return failed("The publish date is not a valid date and time.");
    const status = intent === "publish" ? "published" : "draft";
    const publishedAt = status === "published" ? date ?? existing?.publishedAt ?? nowIst() : date;

    const slug = await uniqueSlug(type, slugify(field("slug") || title), id);
    const content = sanitizePostHtml(String(form.get("content") ?? ""));

    const termIds: number[] = [];
    if (type === "post") {
      for (const c of form.getAll("category")) if (/^\d+$/.test(String(c))) termIds.push(Number(c));
      for (const name of field("tags").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 30)) {
        const tid = await ensureTerm("tag", name.slice(0, 190), slugify(name));
        if (tid) termIds.push(tid);
      }
    }
    const authorRaw = field("author_id");
    const mediaRaw = field("featured_media_id");

    const saved = await savePost(id, {
      type,
      title: title.slice(0, 500),
      slug,
      excerpt: field("excerpt").slice(0, 2000),
      content,
      status,
      authorId: type === "post" && /^\d+$/.test(authorRaw) ? Number(authorRaw) : null,
      featuredMediaId: /^\d+$/.test(mediaRaw) ? Number(mediaRaw) : null,
      commentsOpen: type === "post" && form.get("comments_open") === "1",
      publishedAt,
      termIds,
    });
    if (!saved) return failed("It could not be saved just now. Please try again.");
    await refreshBlog();

    let message = status === "published" ? (existing?.status === "published" ? "Updated." : "Published.") : "Draft saved.";
    if (status === "published" && type === "post" && form.get("notify") === "1") {
      const sent = await announce(saved);
      if (sent !== null) message += ` Subscribers emailed (${sent}).`;
      else if (publishedAt && publishedAt > nowIst()) message += " It goes live on its publish date; announce it to subscribers from the post list then.";
    }
    return done(message, saved);
  }) as Promise<ActionResult>;
}

/** Emails subscribers about an already-published post that has not been announced. */
export async function announceAction(id: number): Promise<ActionResult> {
  return guard(async () => {
    const sent = await announce(id);
    return sent === null ? failed("This post has already been announced, or is not live yet.") : done(`Subscribers emailed (${sent}).`);
  }) as Promise<ActionResult>;
}

export async function setPostStatusAction(id: number, status: "draft" | "trash"): Promise<ActionResult> {
  return guard(async () => {
    if (!(await setPostStatus(id, status))) return failed("Could not change it just now.");
    await refreshBlog();
    return done(status === "trash" ? "Moved to the trash." : "Restored as a draft.");
  }) as Promise<ActionResult>;
}

export async function deletePostAction(id: number): Promise<ActionResult> {
  return guard(async () => {
    const post = await getPostById(id);
    if (!post) return failed("It is already gone.");
    if (post.status !== "trash") return failed("Move it to the trash first.");
    if (!(await deletePost(id))) return failed("Could not delete it just now.");
    await refreshBlog();
    return done("Deleted permanently.");
  }) as Promise<ActionResult>;
}

/* ---------------------------------------------------------------- categories and tags */

export async function createTermAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const taxonomy = form.get("taxonomy") === "tag" ? "tag" : "category";
    const name = String(form.get("name") ?? "").trim();
    if (!name) return failed("Please enter a name.");
    const slug = slugify(String(form.get("slug") ?? "").trim() || name);
    const id = await ensureTerm(taxonomy, name.slice(0, 190), slug);
    if (!id) return failed("Could not add it just now.");
    await refreshBlog();
    return done(`“${name}” added.`, id);
  }) as Promise<ActionResult>;
}

export async function updateTermAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const id = Number(form.get("id"));
    const name = String(form.get("name") ?? "").trim();
    if (!Number.isInteger(id) || !name) return failed("Please enter a name.");
    const res = await updateTerm(id, name.slice(0, 190), slugify(String(form.get("slug") ?? "").trim() || name), String(form.get("description") ?? "").trim());
    if (res === "exists") return failed("Another one already uses that address (slug).");
    if (!res) return failed("Could not save it just now.");
    await refreshBlog();
    return done("Saved.");
  }) as Promise<ActionResult>;
}

export async function deleteTermAction(id: number): Promise<ActionResult> {
  return guard(async () => {
    if (!(await deleteTerm(id))) return failed("Could not delete it just now.");
    await refreshBlog();
    return done("Deleted. Posts that used it keep their other categories and tags.");
  }) as Promise<ActionResult>;
}

/* ---------------------------------------------------------------- authors */

export async function saveAuthorAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const idRaw = String(form.get("id") ?? "");
    const id = /^\d+$/.test(idRaw) ? Number(idRaw) : null;
    const name = String(form.get("name") ?? "").trim();
    if (!name) return failed("Please enter the author's name.");
    const photoRaw = String(form.get("photo_media_id") ?? "");
    const res = await saveAuthor(id, {
      name: name.slice(0, 190),
      slug: slugify(String(form.get("slug") ?? "").trim() || name),
      bio: String(form.get("bio") ?? "").trim().slice(0, 3000),
      photoMediaId: /^\d+$/.test(photoRaw) ? Number(photoRaw) : null,
    });
    if (res === "exists") return failed("Another author already uses that address (slug).");
    if (!res) return failed("Could not save it just now.");
    await refreshBlog();
    return done(id ? "Saved." : `${name} added.`, res);
  }) as Promise<ActionResult>;
}

export async function deleteAuthorAction(id: number): Promise<ActionResult> {
  return guard(async () => {
    if (!(await deleteAuthor(id))) return failed("Could not delete it just now.");
    await refreshBlog();
    return done("Deleted. Their posts stay, without an author.");
  }) as Promise<ActionResult>;
}

/* ---------------------------------------------------------------- media */

export type UploadResult = ActionResult & { media?: Media[] };

export async function uploadMediaAction(prev: UploadResult, form: FormData): Promise<UploadResult> {
  return guard(async () => {
    const who = await requireEditor();
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) return failed("Choose one or more images first.");
    const added: Media[] = [];
    const problems: string[] = [];
    for (const f of files.slice(0, 20)) {
      if (f.size > MAX_UPLOAD) {
        problems.push(`${f.name}: larger than 10 MB`);
        continue;
      }
      const bytes = new Uint8Array(await f.arrayBuffer());
      const ext = sniff(bytes);
      if (!ext) {
        problems.push(`${f.name}: not a JPEG, PNG, GIF, WebP or PDF`);
        continue;
      }
      const stored = await storeUpload(bytes, f.name, ext);
      const alt = String(form.get("alt") ?? "").trim().slice(0, 500);
      const id = await addMedia({ path: stored.path, mime: TYPES[ext].mime, width: stored.width, height: stored.height, size: f.size, alt, title: f.name.slice(0, 500), uploadedBy: who.email });
      if (!id) {
        await removeUpload(stored.path);
        problems.push(`${f.name}: could not be saved`);
        continue;
      }
      added.push({ id, path: stored.path, mime: TYPES[ext].mime, width: stored.width, height: stored.height, alt, title: f.name, size: f.size, createdAt: "" });
    }
    const res: UploadResult = { ...(added.length ? done(`${added.length} uploaded.`) : failed("Nothing was uploaded.")), media: added };
    if (problems.length) res.error = problems.join("; ");
    return res;
  }) as Promise<UploadResult>;
}

/** The media library, for the image picker in the editor. */
export async function listMediaAction(): Promise<Media[]> {
  await requireEditor();
  return (await listMedia(300)) ?? [];
}

export async function updateAltAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const id = Number(form.get("id"));
    if (!Number.isInteger(id)) return failed("Unknown image.");
    if (!(await updateMediaAlt(id, String(form.get("alt") ?? "").trim().slice(0, 500)))) return failed("Could not save it just now.");
    await refreshBlog(); // featured images show their alt text on public pages
    return done("Saved.");
  }) as Promise<ActionResult>;
}

export async function deleteMediaAction(id: number): Promise<ActionResult> {
  return guard(async () => {
    const rows = await query<{ path: string }>("cdnm", "SELECT path FROM blog_media WHERE id = ?", [id]);
    const path = rows?.[0]?.path;
    if (!path) return failed("It is already gone.");
    const used = await query<{ title: string }>(
      "cdnm",
      "SELECT title FROM blog_posts WHERE status <> 'trash' AND (featured_media_id = ? OR content LIKE ?) LIMIT 3",
      [id, `%/wp-content/uploads/${path.replace(/[\\%_]/g, (c) => "\\" + c)}%`]
    );
    if (used === null) return failed("Could not check where it is used.");
    if (used.length) return failed(`Still used in: ${used.map((u) => `“${u.title}”`).join(", ")}. Remove it from there first.`);
    const gone = await deleteMedia(id);
    if (!gone) return failed("Could not delete it just now.");
    await removeUpload(gone.path);
    return done("Deleted.");
  }) as Promise<ActionResult>;
}

/* ---------------------------------------------------------------- comments */

export async function setCommentStatusAction(id: number, status: "pending" | "approved" | "spam" | "trash"): Promise<ActionResult> {
  return guard(async () => {
    if (!(await setCommentStatus(id, status))) return failed("Could not change it just now.");
    await refreshBlog();
    return done(status === "approved" ? "Approved." : status === "pending" ? "Unapproved." : status === "spam" ? "Marked as spam." : "Moved to the trash.");
  }) as Promise<ActionResult>;
}

export async function deleteCommentAction(id: number): Promise<ActionResult> {
  return guard(async () => {
    if (!(await deleteComment(id))) return failed("Could not delete it just now.");
    await refreshBlog();
    return done("Deleted permanently.");
  }) as Promise<ActionResult>;
}

/* ---------------------------------------------------------------- editors (admins only) */

export async function addEditorAction(prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return failed("Please enter a valid email address.");
    const role = form.get("role") === "admin" ? "admin" : "editor";
    return (await addEditor(email, role)) ? done(`${email} can now use the blog admin as ${role === "admin" ? "an admin" : "an editor"}.`) : failed("Could not save it just now.");
  }, "admin") as Promise<ActionResult>;
}

export async function removeEditorAction(id: number): Promise<ActionResult> {
  return guard(async () => {
    const me = await requireEditor("admin");
    const all = (await listEditors()) ?? [];
    const target = all.find((e) => e.id === id);
    if (!target) return failed("Already removed.");
    if (target.email === me.email.toLowerCase()) return failed("You cannot remove yourself.");
    if (target.role === "admin" && all.filter((e) => e.role === "admin").length <= 1) return failed("The blog needs at least one admin.");
    return (await removeEditor(id)) ? done(`${target.email} removed.`) : failed("Could not remove it just now.");
  }, "admin") as Promise<ActionResult>;
}
