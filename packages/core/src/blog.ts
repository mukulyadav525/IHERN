import type { ResultSetHeader } from "mysql2";
import { execute, query, getPool } from "./db";
import { blogUrl } from "./env";
import { plainText, trimWords } from "./text";

/**
 * The IHERN Blog's content, in the `cdnm` database (db/schema.sql). Used by
 * the blog itself and by the main site's Blogs page.
 *
 * Every read returns null when the database is unavailable, so pages can say
 * so rather than show nothing.
 */

export type Term = { id: number; taxonomy: "category" | "tag"; slug: string; name: string; description: string; count: number };
/** `photo` is the path of the author's picture in the media library (blog_media), or null. */
export type Author = { id: number; slug: string; name: string; bio: string; photo: string | null; photoMediaId: number | null };
export type Media = { id: number; path: string; mime: string; width: number | null; height: number | null; alt: string; title: string; size: number; createdAt: string };
export type PostStatus = "draft" | "published" | "trash";
export type { PostType } from "./blog-paths";
import type { PostType } from "./blog-paths";

export type PostSummary = {
  id: number;
  type: PostType;
  slug: string;
  title: string;
  excerpt: string; // plain text
  status: PostStatus;
  publishedAt: string | null; // "YYYY-MM-DD HH:MM:SS", site time
  updatedAt: string;
  author: Author | null;
  categories: Term[];
  tags: Term[];
  image: Media | null;
};

export type Post = PostSummary & {
  content: string; // sanitised HTML
  rawExcerpt: string; // the excerpt as entered ("" = automatic)
  commentsOpen: boolean;
  notifiedAt: string | null;
  wpId: number | null;
};

export const PAGE_SIZE = 10;

export { mediaPath, mediaUrl, postPath, postUrl } from "./blog-paths";

/** The automatic excerpt: about 55 words of the text, like WordPress. */
export function autoExcerpt(content: string, words = 55): string {
  return trimWords(plainText(content), words);
}

/* ---------------------------------------------------------------- rows */

type PostRow = {
  id: number; type: PostType; slug: string; title: string; excerpt: string | null; content?: string; status: PostStatus;
  published_at: string | null; updated_at: string; comments_open?: number; notified_at?: string | null; wp_id?: number | null;
  a_id: number | null; a_slug: string | null; a_name: string | null; a_bio: string | null; a_photo_id: number | null; a_photo: string | null;
  m_id: number | null; m_path: string | null; m_mime: string | null; m_width: number | null; m_height: number | null; m_alt: string | null; m_title: string | null; m_size: number | null; m_created: string | null;
  excerpt_source?: string;
};

const SELECT_SUMMARY = `
  SELECT p.id, p.type, p.slug, p.title, p.excerpt, p.status, p.published_at, p.updated_at,
         LEFT(p.content, 6000) AS excerpt_source,
         a.id AS a_id, a.slug AS a_slug, a.name AS a_name, a.bio AS a_bio, a.photo_media_id AS a_photo_id, am.path AS a_photo,
         m.id AS m_id, m.path AS m_path, m.mime AS m_mime, m.width AS m_width, m.height AS m_height,
         m.alt AS m_alt, m.title AS m_title, m.size AS m_size, m.created_at AS m_created
    FROM blog_posts p
    LEFT JOIN blog_authors a ON a.id = p.author_id
    LEFT JOIN blog_media am ON am.id = a.photo_media_id
    LEFT JOIN blog_media m ON m.id = p.featured_media_id`;

function toMedia(r: PostRow): Media | null {
  if (!r.m_id || !r.m_path) return null;
  return {
    id: Number(r.m_id), path: r.m_path, mime: r.m_mime ?? "", width: r.m_width, height: r.m_height,
    alt: r.m_alt ?? "", title: r.m_title ?? "", size: Number(r.m_size ?? 0), createdAt: r.m_created ?? "",
  };
}

function toSummary(r: PostRow, terms: Map<number, Term[]>): PostSummary {
  const t = terms.get(Number(r.id)) ?? [];
  return {
    id: Number(r.id),
    type: r.type,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt?.trim() ? plainText(r.excerpt) : autoExcerpt(r.excerpt_source ?? r.content ?? ""),
    status: r.status,
    publishedAt: r.published_at,
    updatedAt: r.updated_at,
    author: r.a_id
      ? { id: Number(r.a_id), slug: r.a_slug ?? "", name: r.a_name ?? "", bio: r.a_bio ?? "", photo: r.a_photo ?? null, photoMediaId: r.a_photo_id ? Number(r.a_photo_id) : null }
      : null,
    categories: t.filter((x) => x.taxonomy === "category"),
    tags: t.filter((x) => x.taxonomy === "tag"),
    image: toMedia(r),
  };
}

async function termsFor(postIds: number[]): Promise<Map<number, Term[]> | null> {
  const map = new Map<number, Term[]>();
  if (!postIds.length) return map;
  const rows = await query<{ post_id: number; id: number; taxonomy: "category" | "tag"; slug: string; name: string; description: string | null }>(
    "cdnm",
    `SELECT pt.post_id, t.id, t.taxonomy, t.slug, t.name, t.description
       FROM blog_post_terms pt JOIN blog_terms t ON t.id = pt.term_id
      WHERE pt.post_id IN (${postIds.map(() => "?").join(",")})
      ORDER BY t.name`,
    postIds
  );
  if (rows === null) return null;
  for (const r of rows) {
    const list = map.get(Number(r.post_id)) ?? [];
    list.push({ id: Number(r.id), taxonomy: r.taxonomy, slug: r.slug, name: r.name, description: r.description ?? "", count: 0 });
    map.set(Number(r.post_id), list);
  }
  return map;
}

/* ---------------------------------------------------------------- reading */

export type PostQuery = {
  type?: PostType;
  status?: PostStatus | "any"; // "any" = everything except trash (admin)
  category?: string; // slug
  tag?: string; // slug
  author?: string; // slug
  year?: number;
  month?: number;
  search?: string;
  sort?: "newest" | "oldest" | "az" | "updated";
  limit?: number;
  offset?: number;
};

/** Posts matching the filters, newest first by default, with the total for paging. */
export async function listPosts(q: PostQuery = {}): Promise<{ posts: PostSummary[]; total: number } | null> {
  const where: string[] = ["p.type = ?"];
  const args: (string | number)[] = [q.type ?? "post"];
  const status = q.status ?? "published";
  if (status === "any") where.push("p.status <> 'trash'");
  else {
    where.push("p.status = ?");
    args.push(status);
  }
  if (status === "published") where.push("p.published_at <= NOW()");
  for (const [tax, slug] of [["category", q.category], ["tag", q.tag]] as const) {
    if (slug) {
      where.push("EXISTS (SELECT 1 FROM blog_post_terms pt JOIN blog_terms t ON t.id = pt.term_id WHERE pt.post_id = p.id AND t.taxonomy = ? AND t.slug = ?)");
      args.push(tax, slug);
    }
  }
  if (q.author) {
    where.push("a.slug = ?");
    args.push(q.author);
  }
  if (q.year) {
    where.push("YEAR(p.published_at) = ?");
    args.push(q.year);
  }
  if (q.month) {
    where.push("MONTH(p.published_at) = ?");
    args.push(q.month);
  }
  if (q.search?.trim()) {
    const like = "%" + q.search.trim().replace(/[\\%_]/g, (c) => "\\" + c) + "%";
    where.push("(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)");
    args.push(like, like, like);
  }
  const order =
    q.sort === "oldest" ? "p.published_at ASC, p.id ASC"
    : q.sort === "az" ? "p.title ASC"
    : q.sort === "updated" ? "p.updated_at DESC"
    : "COALESCE(p.published_at, p.updated_at) DESC, p.id DESC";
  const limit = Math.max(1, Math.min(200, q.limit ?? PAGE_SIZE));
  const offset = Math.max(0, q.offset ?? 0);

  const whereSql = where.join(" AND ");
  const [count, rows] = await Promise.all([
    query<{ n: number }>("cdnm", `SELECT COUNT(*) AS n FROM blog_posts p LEFT JOIN blog_authors a ON a.id = p.author_id WHERE ${whereSql}`, args),
    query<PostRow>("cdnm", `${SELECT_SUMMARY} WHERE ${whereSql} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`, args),
  ]);
  if (rows === null || count === null) return null;
  const terms = await termsFor(rows.map((r) => Number(r.id)));
  if (terms === null) return null;
  return { posts: rows.map((r) => toSummary(r, terms)), total: Number(count[0]?.n ?? 0) };
}

async function getPost(where: string, args: (string | number)[]): Promise<Post | null | undefined> {
  const rows = await query<PostRow>(
    "cdnm",
    `${SELECT_SUMMARY.replace("LEFT(p.content, 6000) AS excerpt_source", "p.content, p.comments_open, p.notified_at, p.wp_id")} WHERE ${where} LIMIT 1`,
    args
  );
  if (rows === null) return null;
  const r = rows[0];
  if (!r) return undefined;
  const terms = await termsFor([Number(r.id)]);
  if (terms === null) return null;
  return {
    ...toSummary(r, terms),
    content: r.content ?? "",
    rawExcerpt: r.excerpt ?? "",
    commentsOpen: Boolean(r.comments_open),
    notifiedAt: r.notified_at ?? null,
    wpId: r.wp_id ?? null,
  };
}

/** A published post or page by its slug; undefined when there is none, null when the database is unavailable. */
export function getPublishedBySlug(type: PostType, slug: string) {
  return getPost("p.type = ? AND p.slug = ? AND p.status = 'published' AND p.published_at <= NOW()", [type, slug]);
}

/** Any post by id (admin, previews). */
export function getPostById(id: number) {
  return getPost("p.id = ?", [id]);
}

/** A post imported from WordPress, by its WordPress id (old ?p= links). */
export function getPostByWpId(wpId: number) {
  return getPost("p.wp_id = ? AND p.status = 'published'", [wpId]);
}

/** The posts before and after this one; null when the database is unavailable. */
export async function adjacentPosts(post: Pick<Post, "id" | "publishedAt">): Promise<{ prev: PostSummary | null; next: PostSummary | null } | null> {
  if (!post.publishedAt) return { prev: null, next: null };
  const base = "p.type = 'post' AND p.status = 'published' AND p.published_at <= NOW() AND p.id <> ?";
  const [prev, next] = await Promise.all([
    query<PostRow>("cdnm", `${SELECT_SUMMARY} WHERE ${base} AND (p.published_at < ? OR (p.published_at = ? AND p.id < ?)) ORDER BY p.published_at DESC, p.id DESC LIMIT 1`, [post.id, post.publishedAt, post.publishedAt, post.id]),
    query<PostRow>("cdnm", `${SELECT_SUMMARY} WHERE ${base} AND (p.published_at > ? OR (p.published_at = ? AND p.id > ?)) ORDER BY p.published_at ASC, p.id ASC LIMIT 1`, [post.id, post.publishedAt, post.publishedAt, post.id]),
  ]);
  if (prev === null || next === null) return null;
  const ids = [...prev, ...next].map((r) => Number(r.id));
  const terms = await termsFor(ids);
  if (terms === null) return null;
  return { prev: prev[0] ? toSummary(prev[0], terms) : null, next: next[0] ? toSummary(next[0], terms) : null };
}

/** Categories or tags, with how many published posts use each. */
export async function listTerms(taxonomy: "category" | "tag", onlyUsed = false): Promise<Term[] | null> {
  const rows = await query<{ id: number; taxonomy: "category" | "tag"; slug: string; name: string; description: string | null; n: number }>(
    "cdnm",
    `SELECT t.id, t.taxonomy, t.slug, t.name, t.description,
            (SELECT COUNT(*) FROM blog_post_terms pt JOIN blog_posts p ON p.id = pt.post_id
              WHERE pt.term_id = t.id AND p.type = 'post' AND p.status = 'published' AND p.published_at <= NOW()) AS n
       FROM blog_terms t WHERE t.taxonomy = ? ORDER BY t.name`,
    [taxonomy]
  );
  if (rows === null) return null;
  const terms = rows.map((r) => ({ id: Number(r.id), taxonomy: r.taxonomy, slug: r.slug, name: r.name, description: r.description ?? "", count: Number(r.n) }));
  return onlyUsed ? terms.filter((t) => t.count > 0) : terms;
}

export async function getTerm(taxonomy: "category" | "tag", by: { slug?: string; id?: number; wpId?: number }): Promise<Term | null | undefined> {
  const [col, val] = by.slug !== undefined ? ["slug", by.slug] : by.id !== undefined ? ["id", by.id] : ["wp_id", by.wpId ?? -1];
  const rows = await query<{ id: number; slug: string; name: string; description: string | null }>(
    "cdnm",
    `SELECT id, slug, name, description FROM blog_terms WHERE taxonomy = ? AND ${col} = ? LIMIT 1`,
    [taxonomy, val as string | number]
  );
  if (rows === null) return null;
  const r = rows[0];
  return r ? { id: Number(r.id), taxonomy, slug: r.slug, name: r.name, description: r.description ?? "", count: 0 } : undefined;
}

type AuthorRow = { id: number; slug: string; name: string; bio: string | null; photo_media_id: number | null; photo: string | null };
const toAuthor = (r: AuthorRow): Author => ({
  id: Number(r.id), slug: r.slug, name: r.name, bio: r.bio ?? "", photo: r.photo ?? null, photoMediaId: r.photo_media_id ? Number(r.photo_media_id) : null,
});

export async function listAuthors(onlyWithPosts = false): Promise<(Author & { count: number })[] | null> {
  const rows = await query<AuthorRow & { n: number }>(
    "cdnm",
    `SELECT a.id, a.slug, a.name, a.bio, a.photo_media_id, am.path AS photo,
            (SELECT COUNT(*) FROM blog_posts p WHERE p.author_id = a.id AND p.type = 'post' AND p.status = 'published' AND p.published_at <= NOW()) AS n
       FROM blog_authors a LEFT JOIN blog_media am ON am.id = a.photo_media_id ORDER BY a.name`
  );
  if (rows === null) return null;
  const list = rows.map((r) => ({ ...toAuthor(r), count: Number(r.n) }));
  return onlyWithPosts ? list.filter((a) => a.count > 0) : list;
}

export async function getAuthor(by: { slug?: string; id?: number; wpId?: number }): Promise<Author | null | undefined> {
  const [col, val] = by.slug !== undefined ? ["slug", by.slug] : by.id !== undefined ? ["id", by.id] : ["wp_id", by.wpId ?? -1];
  const rows = await query<AuthorRow>(
    "cdnm",
    `SELECT a.id, a.slug, a.name, a.bio, a.photo_media_id, am.path AS photo
       FROM blog_authors a LEFT JOIN blog_media am ON am.id = a.photo_media_id WHERE a.${col} = ? LIMIT 1`,
    [val as string | number]
  );
  if (rows === null) return null;
  return rows[0] ? toAuthor(rows[0]) : undefined;
}

/** Months that have posts, newest first: [{ year, month, count }]. */
export async function archiveMonths(): Promise<{ year: number; month: number; count: number }[] | null> {
  const rows = await query<{ y: number; m: number; n: number }>(
    "cdnm",
    `SELECT YEAR(published_at) AS y, MONTH(published_at) AS m, COUNT(*) AS n FROM blog_posts
      WHERE type = 'post' AND status = 'published' AND published_at <= NOW()
      GROUP BY y, m ORDER BY y DESC, m DESC`
  );
  return rows === null ? null : rows.map((r) => ({ year: Number(r.y), month: Number(r.m), count: Number(r.n) }));
}

/* ---------------------------------------------------------------- comments */

export type Comment = { id: number; postId: number; subscriberId: number | null; authorName: string; authorEmail: string; content: string; status: string; createdAt: string };

type CommentRow = { id: number; post_id: number; subscriber_id: number | null; author_name: string; author_email: string; content: string; status: string; created_at: string };
const toComment = (r: CommentRow): Comment => ({
  id: Number(r.id), postId: Number(r.post_id), subscriberId: r.subscriber_id === null ? null : Number(r.subscriber_id),
  authorName: r.author_name, authorEmail: r.author_email, content: r.content, status: r.status, createdAt: r.created_at,
});

/** Approved comments on a post, oldest first. */
export async function approvedComments(postId: number): Promise<Comment[] | null> {
  const rows = await query<CommentRow>(
    "cdnm",
    "SELECT id, post_id, subscriber_id, author_name, '' AS author_email, content, status, created_at FROM blog_comments WHERE post_id = ? AND status = 'approved' ORDER BY created_at, id",
    [postId]
  );
  return rows === null ? null : rows.map(toComment);
}

/** A reader's own comments still waiting for approval on this post. */
export async function pendingCommentsBy(postId: number, subscriberId: number): Promise<Comment[] | null> {
  const rows = await query<CommentRow>("cdnm", "SELECT * FROM blog_comments WHERE post_id = ? AND subscriber_id = ? AND status = 'pending' ORDER BY created_at, id", [postId, subscriberId]);
  return rows === null ? null : rows.map(toComment);
}

/**
 * Adds a comment from a signed-in reader. Published straight away when the
 * reader has had a comment approved before; otherwise it waits for an editor.
 */
export async function addComment(c: { postId: number; subscriberId: number; name: string; email: string; content: string }): Promise<"approved" | "pending" | null> {
  const before = await query<{ n: number }>("cdnm", "SELECT COUNT(*) AS n FROM blog_comments WHERE subscriber_id = ? AND status = 'approved'", [c.subscriberId]);
  if (before === null) return null;
  const status = Number(before[0]?.n ?? 0) > 0 ? "approved" : "pending";
  const res = await execute("cdnm", "INSERT INTO blog_comments (post_id, subscriber_id, author_name, author_email, content, status) VALUES (?, ?, ?, ?, ?, ?)", [
    c.postId, c.subscriberId, c.name, c.email, c.content, status,
  ]);
  return res === null ? null : status;
}

export async function commentCounts(postIds: number[]): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  if (!postIds.length) return map;
  const rows = await query<{ post_id: number; n: number }>(
    "cdnm",
    `SELECT post_id, COUNT(*) AS n FROM blog_comments WHERE status = 'approved' AND post_id IN (${postIds.map(() => "?").join(",")}) GROUP BY post_id`,
    postIds
  );
  for (const r of rows ?? []) map.set(Number(r.post_id), Number(r.n));
  return map;
}

/* ---------------------------------------------------------------- writing (admin) */

export type PostInput = {
  type: PostType;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // already sanitised
  status: PostStatus;
  authorId: number | null;
  featuredMediaId: number | null;
  commentsOpen: boolean;
  publishedAt: string | null; // "YYYY-MM-DD HH:MM:SS"
  termIds: number[];
};

/** A slug not used by another post of the same type. */
export async function uniqueSlug(type: PostType, slug: string, exceptId: number | null): Promise<string> {
  let candidate = slug;
  for (let i = 2; i < 200; i++) {
    const rows = await query<{ id: number }>("cdnm", "SELECT id FROM blog_posts WHERE type = ? AND slug = ? AND id <> ? LIMIT 1", [type, candidate, exceptId ?? 0]);
    if (!rows || !rows.length) return candidate;
    candidate = `${slug}-${i}`;
  }
  return `${slug}-${Date.now()}`;
}

/** Creates (id null) or updates a post with its categories and tags, in one transaction. Returns the id. */
export async function savePost(id: number | null, p: PostInput): Promise<number | null> {
  const pool = getPool("cdnm");
  if (!pool) return null;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const values = [p.type, p.slug, p.title, p.excerpt, p.content, p.status, p.authorId, p.featuredMediaId, p.commentsOpen ? 1 : 0, p.publishedAt];
    let postId = id;
    if (postId === null) {
      const [res] = await conn.execute<ResultSetHeader>(
        `INSERT INTO blog_posts (type, slug, title, excerpt, content, status, author_id, featured_media_id, comments_open, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values
      );
      postId = res.insertId;
    } else {
      await conn.execute(
        `UPDATE blog_posts SET type = ?, slug = ?, title = ?, excerpt = ?, content = ?, status = ?, author_id = ?,
                featured_media_id = ?, comments_open = ?, published_at = ? WHERE id = ?`,
        [...values, postId]
      );
    }
    await conn.execute("DELETE FROM blog_post_terms WHERE post_id = ?", [postId]);
    for (const termId of Array.from(new Set(p.termIds))) {
      await conn.execute("INSERT INTO blog_post_terms (post_id, term_id) VALUES (?, ?)", [postId, termId]);
    }
    await conn.commit();
    return postId;
  } catch (e) {
    await conn.rollback().catch(() => {});
    console.error("[IHERN blog] save post failed:", (e as Error).message);
    return null;
  } finally {
    conn.release();
  }
}

export async function setPostStatus(id: number, status: PostStatus): Promise<boolean> {
  return (await execute("cdnm", "UPDATE blog_posts SET status = ? WHERE id = ?", [status, id])) !== null;
}

export async function deletePost(id: number): Promise<boolean> {
  return (await execute("cdnm", "DELETE FROM blog_posts WHERE id = ?", [id])) !== null;
}

/** Marks a post as announced to subscribers; true only for the first caller. */
export async function claimNotification(id: number): Promise<boolean> {
  const res = await execute("cdnm", "UPDATE blog_posts SET notified_at = NOW() WHERE id = ? AND notified_at IS NULL", [id]);
  return res !== null && res.affectedRows === 1;
}

/** Find or create a term by name (tags typed in the editor). */
export async function ensureTerm(taxonomy: "category" | "tag", name: string, slug: string): Promise<number | null> {
  const existing = await query<{ id: number }>("cdnm", "SELECT id FROM blog_terms WHERE taxonomy = ? AND (slug = ? OR name = ?) LIMIT 1", [taxonomy, slug, name]);
  if (existing === null) return null;
  if (existing[0]) return Number(existing[0].id);
  const res = await execute("cdnm", "INSERT INTO blog_terms (taxonomy, slug, name) VALUES (?, ?, ?)", [taxonomy, slug, name]);
  return res === null ? null : Number(res.insertId);
}

export async function updateTerm(id: number, name: string, slug: string, description: string): Promise<boolean | "exists"> {
  const dupe = await query("cdnm", "SELECT id FROM blog_terms WHERE slug = ? AND taxonomy = (SELECT taxonomy FROM blog_terms WHERE id = ?) AND id <> ?", [slug, id, id]);
  if (dupe === null) return false;
  if (dupe.length) return "exists";
  return (await execute("cdnm", "UPDATE blog_terms SET name = ?, slug = ?, description = ? WHERE id = ?", [name, slug, description, id])) !== null;
}

export async function deleteTerm(id: number): Promise<boolean> {
  return (await execute("cdnm", "DELETE FROM blog_terms WHERE id = ?", [id])) !== null;
}

export async function saveAuthor(id: number | null, a: { name: string; slug: string; bio: string; photoMediaId: number | null }): Promise<number | null | "exists"> {
  const dupe = await query("cdnm", "SELECT id FROM blog_authors WHERE slug = ? AND id <> ?", [a.slug, id ?? 0]);
  if (dupe === null) return null;
  if (dupe.length) return "exists";
  if (id === null) {
    const res = await execute("cdnm", "INSERT INTO blog_authors (slug, name, bio, photo_media_id) VALUES (?, ?, ?, ?)", [a.slug, a.name, a.bio, a.photoMediaId]);
    return res === null ? null : Number(res.insertId);
  }
  const res = await execute("cdnm", "UPDATE blog_authors SET slug = ?, name = ?, bio = ?, photo_media_id = ? WHERE id = ?", [a.slug, a.name, a.bio, a.photoMediaId, id]);
  return res === null ? null : id;
}

export async function deleteAuthor(id: number): Promise<boolean> {
  return (await execute("cdnm", "DELETE FROM blog_authors WHERE id = ?", [id])) !== null;
}

/* ---------------------------------------------------------------- media */

export async function listMedia(limit = 200): Promise<Media[] | null> {
  const rows = await query<{ id: number; path: string; mime: string; width: number | null; height: number | null; alt: string; title: string; size: number; created_at: string }>(
    "cdnm",
    `SELECT id, path, mime, width, height, alt, title, size, created_at FROM blog_media ORDER BY created_at DESC, id DESC LIMIT ${Math.max(1, Math.min(1000, limit))}`
  );
  return rows === null ? null : rows.map((r) => ({ id: Number(r.id), path: r.path, mime: r.mime, width: r.width, height: r.height, alt: r.alt, title: r.title, size: Number(r.size), createdAt: r.created_at }));
}

export async function addMedia(m: { path: string; mime: string; width: number | null; height: number | null; size: number; alt: string; title: string; uploadedBy: string }): Promise<number | null> {
  const res = await execute("cdnm", "INSERT INTO blog_media (path, mime, width, height, size, alt, title, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
    m.path, m.mime, m.width, m.height, m.size, m.alt, m.title, m.uploadedBy,
  ]);
  return res === null ? null : Number(res.insertId);
}

export async function updateMediaAlt(id: number, alt: string): Promise<boolean> {
  return (await execute("cdnm", "UPDATE blog_media SET alt = ? WHERE id = ?", [alt, id])) !== null;
}

export async function getMedia(id: number): Promise<Media | null | undefined> {
  const rows = await listMediaWhere("id = ?", [id]);
  return rows === null ? null : rows[0];
}

async function listMediaWhere(where: string, args: (string | number)[]) {
  const rows = await query<{ id: number; path: string; mime: string; width: number | null; height: number | null; alt: string; title: string; size: number; created_at: string }>(
    "cdnm",
    `SELECT id, path, mime, width, height, alt, title, size, created_at FROM blog_media WHERE ${where}`,
    args
  );
  return rows === null ? null : rows.map((r) => ({ id: Number(r.id), path: r.path, mime: r.mime, width: r.width, height: r.height, alt: r.alt, title: r.title, size: Number(r.size), createdAt: r.created_at }));
}

export async function deleteMedia(id: number): Promise<Media | null> {
  const m = await getMedia(id);
  if (!m) return null;
  return (await execute("cdnm", "DELETE FROM blog_media WHERE id = ?", [id])) === null ? null : m;
}

/* ---------------------------------------------------------------- comments (admin) */

export async function listCommentsForAdmin(status: "pending" | "approved" | "spam" | "trash" | "all"): Promise<(Comment & { postTitle: string; postSlug: string })[] | null> {
  const rows = await query<CommentRow & { post_title: string; post_slug: string }>(
    "cdnm",
    `SELECT c.*, p.title AS post_title, p.slug AS post_slug FROM blog_comments c JOIN blog_posts p ON p.id = c.post_id
      ${status === "all" ? "WHERE c.status <> 'trash'" : "WHERE c.status = ?"} ORDER BY c.created_at DESC, c.id DESC LIMIT 500`,
    status === "all" ? [] : [status]
  );
  return rows === null ? null : rows.map((r) => ({ ...toComment(r), postTitle: r.post_title, postSlug: r.post_slug }));
}

export async function setCommentStatus(id: number, status: "pending" | "approved" | "spam" | "trash"): Promise<boolean> {
  return (await execute("cdnm", "UPDATE blog_comments SET status = ? WHERE id = ?", [status, id])) !== null;
}

export async function deleteComment(id: number): Promise<boolean> {
  return (await execute("cdnm", "DELETE FROM blog_comments WHERE id = ?", [id])) !== null;
}

/* ---------------------------------------------------------------- editors */

export type Editor = { id: number; email: string; role: "admin" | "editor"; active: boolean; createdAt: string };
type EditorRow = { id: number; email: string; role: "admin" | "editor"; active: number; created_at: string };
const toEditor = (r: EditorRow): Editor => ({ id: Number(r.id), email: r.email, role: r.role, active: Number(r.active) === 1, createdAt: r.created_at });

/** The active editor record for this email, undefined when they are not an editor (or deactivated). */
export async function getEditor(email: string): Promise<Editor | null | undefined> {
  const rows = await query<EditorRow>("cdnm", "SELECT * FROM blog_editors WHERE email = ? AND active = 1 LIMIT 1", [email.toLowerCase()]);
  if (rows === null) return null;
  return rows[0] ? toEditor(rows[0]) : undefined;
}

/** Everyone on the list, deactivated editors included. */
export async function listEditors(): Promise<Editor[] | null> {
  const rows = await query<EditorRow>("cdnm", "SELECT * FROM blog_editors ORDER BY active DESC, role, email");
  return rows === null ? null : rows.map(toEditor);
}

/** "added" (new to the list), "updated" (already on it: role changed, active again), or null on failure. */
export async function addEditor(email: string, role: "admin" | "editor"): Promise<"added" | "updated" | null> {
  const res = await execute("cdnm", "INSERT INTO blog_editors (email, role) VALUES (?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role), active = 1", [email.toLowerCase(), role]);
  // MySQL counts 1 for an insert, 2 for an update, 0 when nothing changed.
  return res === null ? null : res.affectedRows === 1 ? "added" : "updated";
}

export async function setEditorActive(id: number, active: boolean): Promise<boolean> {
  const res = await execute("cdnm", "UPDATE blog_editors SET active = ? WHERE id = ?", [active ? 1 : 0, id]);
  return res !== null && res.affectedRows > 0;
}

export async function removeEditor(id: number): Promise<boolean> {
  return (await execute("cdnm", "DELETE FROM blog_editors WHERE id = ?", [id])) !== null;
}

/* ---------------------------------------------------------------- dashboard */

export async function blogCounts(): Promise<{ published: number; drafts: number; pendingComments: number; subscribers: number } | null> {
  const rows = await query<{ published: number; drafts: number; pending: number; subs: number }>(
    "cdnm",
    `SELECT (SELECT COUNT(*) FROM blog_posts WHERE type = 'post' AND status = 'published') AS published,
            (SELECT COUNT(*) FROM blog_posts WHERE type = 'post' AND status = 'draft') AS drafts,
            (SELECT COUNT(*) FROM blog_comments WHERE status = 'pending') AS pending,
            (SELECT COUNT(*) FROM blog_subscriptions WHERE status = 'active') AS subs`
  );
  if (!rows || !rows[0]) return null;
  const r = rows[0];
  return { published: Number(r.published), drafts: Number(r.drafts), pendingComments: Number(r.pending), subscribers: Number(r.subs) };
}
