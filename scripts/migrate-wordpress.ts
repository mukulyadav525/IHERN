/**
 * Copies the WordPress blog's content into the new blog's tables.
 *
 *   npm run db:migrate-wordpress -- --uploads /path/to/wordpress/wp-content/uploads [--prefix ihernblog_] [--update]
 *
 * Reads the WordPress tables in the cdnm database (prefix ihernblog_ by
 * default) and fills blog_authors, blog_media, blog_terms, blog_posts,
 * blog_post_terms, blog_comments and blog_editors. Copies the uploads folder
 * into BLOG_UPLOAD_DIR, keeping the same year/month layout so every image
 * address in the posts keeps working.
 *
 * - Safe to run again. Without --update, content already copied is left as it
 *   is (so edits made in the new blog are kept); with --update it is
 *   refreshed from WordPress.
 * - Posts keep their WordPress ids (wp_id), so old /?p=196 links redirect.
 * - Already-published posts are marked as announced: subscribers are NOT
 *   emailed about them again.
 * - The WordPress tables are only read, never changed.
 */
import { copyFile, mkdir, readdir, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { loadEnv } from "./env";

type Args = { uploads: string | null; prefix: string; update: boolean };

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const val = (k: string) => {
    const i = a.indexOf(k);
    return i >= 0 ? a[i + 1] ?? null : null;
  };
  return { uploads: val("--uploads"), prefix: val("--prefix") || "ihernblog_", update: a.includes("--update") };
}

/* ------------------------------------------------ PHP unserialize (WordPress metadata) */

type PhpValue = string | number | boolean | null | { [k: string]: PhpValue };

function unserialize(input: string): PhpValue {
  const buf = Buffer.from(input, "utf8");
  let i = 0;
  const readUntil = (ch: string) => {
    const end = buf.indexOf(ch, i);
    const s = buf.toString("utf8", i, end);
    i = end + 1;
    return s;
  };
  const value = (): PhpValue => {
    const t = String.fromCharCode(buf[i]);
    i += 2; // "x:"
    switch (t) {
      case "N":
        return null;
      case "b":
        return readUntil(";") === "1";
      case "i":
      case "d":
        return Number(readUntil(";"));
      case "s": {
        const len = Number(readUntil(":"));
        i += 1; // opening quote
        const s = buf.toString("utf8", i, i + len);
        i += len + 2; // closing quote and ;
        return s;
      }
      case "a": {
        const n = Number(readUntil(":"));
        i += 1; // {
        const out: { [k: string]: PhpValue } = {};
        for (let k = 0; k < n; k++) {
          const key = value();
          out[String(key)] = value();
        }
        i += 1; // }
        return out;
      }
      default:
        throw new Error(`unsupported serialized type ${t}`);
    }
  };
  // "i:" etc. consume "x:"; "N;" is two chars
  return value();
}

/* ------------------------------------------------ helpers */

async function copyTree(from: string, to: string): Promise<number> {
  let copied = 0;
  const entries = await readdir(from, { withFileTypes: true });
  for (const e of entries) {
    const src = path.join(from, e.name);
    const dst = path.join(to, e.name);
    if (e.isDirectory()) {
      copied += await copyTree(src, dst);
    } else if (e.isFile() && /\.(jpe?g|png|gif|webp|svg|pdf)$/i.test(e.name)) {
      await mkdir(to, { recursive: true });
      if (!existsSync(dst) || (await stat(dst)).size !== (await stat(src)).size) {
        await copyFile(src, dst);
        copied++;
      }
    }
  }
  return copied;
}

const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

/** WordPress's wpautop for classic (non-block) content: blank lines become paragraphs. */
function autop(text: string): string {
  if (/<p[\s>]/i.test(text) || !/\n\s*\n/.test(text)) return text;
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (/^<(h[1-6]|ul|ol|blockquote|figure|table|div|hr)/i.test(p) ? p : `<p>${p.replace(/\n/g, "<br />")}</p>`))
    .join("\n");
}

/* ------------------------------------------------ main */

async function main() {
  const envFile = loadEnv();
  const args = parseArgs();
  const P = args.prefix;
  if (!/^[A-Za-z0-9_]+$/.test(P)) throw new Error("--prefix must be a table prefix like ihernblog_");

  const { getPool } = await import("@ihern/core/db");
  const { sanitizePostHtml } = await import("@ihern/core/html");
  const { slugify } = await import("@ihern/core/text");
  const pool = getPool("cdnm");
  if (!pool) throw new Error(`The cdnm database is not configured (settings read from ${envFile ?? "the environment"}).`);
  const q = async <T>(sql: string, params: unknown[] = []) => (await pool.query(sql, params))[0] as T[];
  const run = async (sql: string, params: unknown[] = []) => (await pool.query(sql, params))[0] as { insertId: number; affectedRows: number };

  const uploadDir = path.resolve(process.env.BLOG_UPLOAD_DIR || path.resolve(__dirname, "../apps/blog/uploads"));
  const counts: Record<string, number> = {};
  const bump = (k: string) => (counts[k] = (counts[k] ?? 0) + 1);

  // 0. The blog's tables must exist.
  const have = await q<{ n: number }>("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'blog_posts'");
  if (!Number(have[0]?.n)) throw new Error("The blog tables are missing - run `npm run db:schema` first.");

  // 1. Files.
  if (args.uploads) {
    if (!existsSync(args.uploads)) throw new Error(`No such folder: ${args.uploads}`);
    const n = await copyTree(path.resolve(args.uploads), uploadDir);
    console.log(`files: ${n} copied into ${uploadDir}`);
  } else {
    console.log("files: --uploads not given; images are not copied (pass the WordPress wp-content/uploads folder).");
  }

  // 2. Authors: the WordPress users who wrote posts or pages.
  const users = await q<{ ID: number; user_nicename: string; display_name: string; bio: string | null }>(
    `SELECT u.ID, u.user_nicename, u.display_name,
            (SELECT meta_value FROM ${P}usermeta m WHERE m.user_id = u.ID AND m.meta_key = 'description' LIMIT 1) AS bio
       FROM ${P}users u
      WHERE u.ID IN (SELECT DISTINCT post_author FROM ${P}posts WHERE post_type IN ('post','page') AND post_status IN ('publish','future','draft','pending','private'))`
  );
  const authorIds = new Map<number, number>();
  for (const usr of users) {
    const existing = await q<{ id: number }>("SELECT id FROM blog_authors WHERE wp_id = ?", [usr.ID]);
    const name = decode(usr.display_name || usr.user_nicename);
    const bio = decode(usr.bio ?? "");
    if (existing[0]) {
      authorIds.set(usr.ID, existing[0].id);
      if (args.update) await run("UPDATE blog_authors SET name = ?, bio = ? WHERE id = ?", [name, bio, existing[0].id]);
      continue;
    }
    let slug = usr.user_nicename || slugify(name);
    if ((await q("SELECT id FROM blog_authors WHERE slug = ?", [slug])).length) slug = `${slug}-${usr.ID}`;
    const res = await run("INSERT INTO blog_authors (slug, name, bio, wp_id) VALUES (?, ?, ?, ?)", [slug, name, bio, usr.ID]);
    authorIds.set(usr.ID, res.insertId);
    bump("authors");
  }

  // 3. Images and files (attachments).
  const attachments = await q<{ ID: number; post_title: string; post_mime_type: string; post_date: string; file: string | null; meta: string | null; alt: string | null }>(
    `SELECT p.ID, p.post_title, p.post_mime_type, p.post_date,
            (SELECT meta_value FROM ${P}postmeta m WHERE m.post_id = p.ID AND m.meta_key = '_wp_attached_file' LIMIT 1) AS file,
            (SELECT meta_value FROM ${P}postmeta m WHERE m.post_id = p.ID AND m.meta_key = '_wp_attachment_metadata' LIMIT 1) AS meta,
            (SELECT meta_value FROM ${P}postmeta m WHERE m.post_id = p.ID AND m.meta_key = '_wp_attachment_image_alt' LIMIT 1) AS alt
       FROM ${P}posts p WHERE p.post_type = 'attachment'`
  );
  const mediaIds = new Map<number, number>();
  const missingFiles: string[] = [];
  for (const att of attachments) {
    if (!att.file) continue;
    let file = att.file;
    let width: number | null = null;
    let height: number | null = null;
    let size = 0;
    const variants: { file: string; width: number; height: number }[] = [];
    try {
      const meta = att.meta ? (unserialize(att.meta) as { [k: string]: PhpValue }) : {};
      width = typeof meta.width === "number" ? meta.width : null;
      height = typeof meta.height === "number" ? meta.height : null;
      size = typeof meta.filesize === "number" ? meta.filesize : 0;
      const sizes = (meta.sizes ?? {}) as { [k: string]: { [k: string]: PhpValue } };
      for (const s of Object.values(sizes)) {
        if (typeof s.file === "string" && typeof s.width === "number" && typeof s.height === "number") variants.push({ file: s.file, width: s.width, height: s.height });
      }
    } catch {
      /* unreadable metadata: keep the file without dimensions */
    }
    // A missing original (seen on copies of the site): use the largest size WordPress made of it.
    if (args.uploads && !existsSync(path.join(uploadDir, file))) {
      const dir = path.dirname(file);
      const best = variants.filter((v) => existsSync(path.join(uploadDir, dir, v.file))).sort((a, b) => b.width - a.width)[0];
      if (best) {
        file = `${dir}/${best.file}`;
        width = best.width;
        height = best.height;
        size = 0;
      } else {
        missingFiles.push(file);
      }
    }
    const existing = await q<{ id: number }>("SELECT id FROM blog_media WHERE wp_id = ?", [att.ID]);
    if (existing[0]) {
      mediaIds.set(att.ID, existing[0].id);
      if (args.update) await run("UPDATE blog_media SET path = ?, mime = ?, width = ?, height = ?, size = ?, alt = ?, title = ? WHERE id = ?", [file, att.post_mime_type, width, height, size, decode(att.alt ?? ""), decode(att.post_title), existing[0].id]);
      continue;
    }
    const byPath = await q<{ id: number }>("SELECT id FROM blog_media WHERE path = ?", [file]);
    if (byPath[0]) {
      mediaIds.set(att.ID, byPath[0].id);
      continue;
    }
    const res = await run(
      "INSERT INTO blog_media (path, mime, width, height, size, alt, title, uploaded_by, wp_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'wordpress', ?, ?)",
      [file, att.post_mime_type || "application/octet-stream", width, height, size, decode(att.alt ?? ""), decode(att.post_title), att.ID, att.post_date]
    );
    mediaIds.set(att.ID, res.insertId);
    bump("media");
  }

  // 4. Categories and tags.
  const terms = await q<{ term_id: number; name: string; slug: string; taxonomy: string; description: string }>(
    `SELECT t.term_id, t.name, t.slug, tt.taxonomy, tt.description
       FROM ${P}terms t JOIN ${P}term_taxonomy tt ON tt.term_id = t.term_id
      WHERE tt.taxonomy IN ('category', 'post_tag')`
  );
  const termIds = new Map<string, number>(); // "taxonomy:wpTermId" -> id
  for (const t of terms) {
    const taxonomy = t.taxonomy === "post_tag" ? "tag" : "category";
    if (taxonomy === "category" && t.slug === "uncategorized") continue; // WordPress's placeholder
    const existing = await q<{ id: number }>("SELECT id FROM blog_terms WHERE taxonomy = ? AND (wp_id = ? OR slug = ?)", [taxonomy, t.term_id, t.slug]);
    if (existing[0]) {
      termIds.set(`${t.taxonomy}:${t.term_id}`, existing[0].id);
      if (args.update) await run("UPDATE blog_terms SET name = ?, description = ?, wp_id = ? WHERE id = ?", [decode(t.name), decode(t.description ?? ""), t.term_id, existing[0].id]);
      continue;
    }
    const res = await run("INSERT INTO blog_terms (taxonomy, slug, name, description, wp_id) VALUES (?, ?, ?, ?, ?)", [taxonomy, t.slug, decode(t.name), decode(t.description ?? ""), t.term_id]);
    termIds.set(`${t.taxonomy}:${t.term_id}`, res.insertId);
    bump(taxonomy === "tag" ? "tags" : "categories");
  }

  // 5. Posts and pages. The old upload addresses become this blog's.
  const uploadHosts = await q<{ option_value: string }>(`SELECT option_value FROM ${P}options WHERE option_name IN ('siteurl', 'home')`);
  const oldBases = new Set([
    ...uploadHosts.map((r) => r.option_value.replace(/\/+$/, "")),
    "http://localhost/ihernblog/wordpress",
    "https://intranet.iiitd.edu.in/blog",
    "https://ihernblog.iiitd.ac.in",
    "http://ihernblog.iiitd.ac.in",
  ]);
  const rewriteUploads = (html: string) => {
    let out = html;
    for (const base of oldBases) out = out.split(`${base}/wp-content/uploads/`).join("/wp-content/uploads/");
    return out;
  };

  const posts = await q<{
    ID: number; post_type: "post" | "page"; post_name: string; post_title: string; post_excerpt: string; post_content: string;
    post_status: string; post_author: number; post_date: string; post_modified: string; comment_status: string; thumb: string | null;
  }>(
    `SELECT p.ID, p.post_type, p.post_name, p.post_title, p.post_excerpt, p.post_content, p.post_status, p.post_author,
            p.post_date, p.post_modified, p.comment_status,
            (SELECT meta_value FROM ${P}postmeta m WHERE m.post_id = p.ID AND m.meta_key = '_thumbnail_id' LIMIT 1) AS thumb
       FROM ${P}posts p
      WHERE p.post_type IN ('post', 'page') AND p.post_status IN ('publish', 'future', 'draft', 'pending', 'private')`
  );
  const postIds = new Map<number, number>();
  for (const p of posts) {
    // WordPress's own placeholder pages are not content.
    if (p.post_type === "page" && (p.post_name === "privacy-policy" || p.post_name === "sample-page")) continue;
    // The "Subscribe" page only held the old email-subscribers form; the blog has its own /subscribe.
    if (p.post_type === "page" && /\[email-subscribers-form/.test(p.post_content)) continue;

    const status = p.post_status === "publish" || p.post_status === "future" ? "published" : "draft";
    const title = decode(p.post_title).trim() || "(untitled)";
    const content = sanitizePostHtml(rewriteUploads(autop(p.post_content)));
    const values = {
      type: p.post_type,
      title,
      excerpt: decode(p.post_excerpt ?? "").trim(),
      content,
      status,
      author: authorIds.get(Number(p.post_author)) ?? null,
      media: p.thumb ? mediaIds.get(Number(p.thumb)) ?? null : null,
      comments: p.comment_status === "open" ? 1 : 0,
      published: status === "published" || p.post_date !== "0000-00-00 00:00:00" ? p.post_date : null,
      updated: p.post_modified,
    };
    const existing = await q<{ id: number }>("SELECT id FROM blog_posts WHERE wp_id = ?", [p.ID]);
    if (existing[0]) {
      postIds.set(p.ID, existing[0].id);
      if (!args.update) continue;
      await run(
        `UPDATE blog_posts SET title = ?, excerpt = ?, content = ?, status = ?, author_id = ?, featured_media_id = ?,
                comments_open = ?, published_at = ?, updated_at = ? WHERE id = ?`,
        [values.title, values.excerpt, values.content, values.status, values.author, values.media, values.comments, values.published, values.updated, existing[0].id]
      );
      bump("posts refreshed");
    } else {
      let slug = (p.post_name || slugify(title)).slice(0, 200);
      if ((await q("SELECT id FROM blog_posts WHERE type = ? AND slug = ?", [p.post_type, slug])).length) slug = `${slug}-${p.ID}`;
      const res = await run(
        `INSERT INTO blog_posts (type, slug, title, excerpt, content, status, author_id, featured_media_id, comments_open,
                                 published_at, created_at, updated_at, notified_at, wp_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.post_type, slug, values.title, values.excerpt, values.content, values.status, values.author, values.media, values.comments,
          values.published, p.post_date, values.updated,
          // already public on WordPress: never announce these to subscribers again
          status === "published" ? p.post_date : null,
          p.ID]
      );
      postIds.set(p.ID, res.insertId);
      bump(p.post_type === "page" ? "pages" : "posts");
    }

    // categories and tags
    const rel = await q<{ term_id: number; taxonomy: string }>(
      `SELECT tt.term_id, tt.taxonomy FROM ${P}term_relationships tr JOIN ${P}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
        WHERE tr.object_id = ? AND tt.taxonomy IN ('category', 'post_tag')`,
      [p.ID]
    );
    const id = postIds.get(p.ID)!;
    if (args.update || !existing[0]) {
      await run("DELETE FROM blog_post_terms WHERE post_id = ?", [id]);
      for (const r of rel) {
        const termId = termIds.get(`${r.taxonomy}:${r.term_id}`);
        if (termId) await run("INSERT IGNORE INTO blog_post_terms (post_id, term_id) VALUES (?, ?)", [id, termId]);
      }
    }
  }

  // 6. Comments.
  const comments = await q<{ comment_ID: number; comment_post_ID: number; comment_author: string; comment_author_email: string; comment_content: string; comment_approved: string; comment_date: string; comment_type: string }>(
    `SELECT comment_ID, comment_post_ID, comment_author, comment_author_email, comment_content, comment_approved, comment_date, comment_type
       FROM ${P}comments WHERE comment_type IN ('', 'comment')`
  );
  for (const c of comments) {
    const postId = postIds.get(Number(c.comment_post_ID));
    if (!postId) continue;
    if ((await q("SELECT id FROM blog_comments WHERE wp_id = ?", [c.comment_ID])).length) continue;
    const status = c.comment_approved === "1" ? "approved" : c.comment_approved === "spam" ? "spam" : c.comment_approved === "trash" ? "trash" : "pending";
    const sub = await q<{ id: number }>("SELECT id FROM blog_subscribers WHERE email = ?", [String(c.comment_author_email).toLowerCase()]);
    await run(
      "INSERT INTO blog_comments (post_id, subscriber_id, author_name, author_email, content, status, created_at, wp_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [postId, sub[0]?.id ?? null, decode(c.comment_author), String(c.comment_author_email).toLowerCase(), decode(c.comment_content.replace(/<[^>]*>/g, "")), status, c.comment_date, c.comment_ID]
    );
    bump("comments");
  }

  // 7. Editors: WordPress administrators and editors may use the new admin area.
  const staff = await q<{ email: string; caps: string }>(
    `SELECT u.user_email AS email, m.meta_value AS caps FROM ${P}users u JOIN ${P}usermeta m ON m.user_id = u.ID AND m.meta_key = '${P}capabilities'`
  );
  for (const s of staff) {
    const role = /"administrator"/.test(s.caps) ? "admin" : /"editor"/.test(s.caps) ? "editor" : null;
    if (!role || !s.email) continue;
    const res = await run("INSERT IGNORE INTO blog_editors (email, role) VALUES (?, ?)", [s.email.toLowerCase(), role]);
    if (res.affectedRows) bump(`editors (${role})`);
  }

  console.log("\nadded:", Object.keys(counts).length ? counts : "nothing new");
  console.log("now in the blog:", (await q<{ t: string; n: number }>(
    "SELECT 'posts' AS t, COUNT(*) AS n FROM blog_posts WHERE type='post' UNION ALL SELECT 'pages', COUNT(*) FROM blog_posts WHERE type='page' UNION ALL SELECT 'categories', COUNT(*) FROM blog_terms WHERE taxonomy='category' UNION ALL SELECT 'tags', COUNT(*) FROM blog_terms WHERE taxonomy='tag' UNION ALL SELECT 'authors', COUNT(*) FROM blog_authors UNION ALL SELECT 'images', COUNT(*) FROM blog_media UNION ALL SELECT 'comments', COUNT(*) FROM blog_comments UNION ALL SELECT 'editors', COUNT(*) FROM blog_editors"
  )).map((r) => `${r.t} ${r.n}`).join(", "));
  if (missingFiles.length) console.log(`\nimage files not found in the uploads folder (${missingFiles.length}):\n  ${missingFiles.join("\n  ")}`);
  await pool.end();
}

main().catch((e) => {
  console.error("migration failed:", e.message);
  process.exit(1);
});
