import Link from "next/link";
import type { PostSummary, Term } from "@ihern/core/blog";
import { mediaPath, mediaSrcSet, postPath } from "@ihern/core/blog-paths";
import { formatDate } from "@ihern/core/text";
import { u } from "@/lib/paths";

/** Building blocks shared by the listings and the post page. */

export function Chips({ terms, kind = "category" }: { terms: Term[]; kind?: "category" | "tag" }) {
  if (!terms.length) return null;
  return (
    <div className={`b-chips${kind === "tag" ? " b-chips--tags" : ""}`}>
      {terms.map((t) => (
        <Link key={t.id} className="b-chip" href={`/${kind}/${t.slug}`}>
          {t.name}
        </Link>
      ))}
    </div>
  );
}

export function AuthorIcon() {
  return (
    <span className="b-author-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" /></svg>
    </span>
  );
}

function CalendarIcon() {
  return (
    <svg className="b-meta-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path fill="currentColor" d="M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3V2Zm12 8H5v9h14v-9ZM5 8h14V6H5v2Z" />
    </svg>
  );
}

export function PostMeta({ post, comments }: { post: PostSummary; comments?: number }) {
  return (
    <div className="b-meta">
      {post.author ? (
        <Link className="b-meta-author" href={`/author/${post.author.slug}`}>
          <AuthorIcon />
          {post.author.name}
        </Link>
      ) : null}
      {post.publishedAt ? (
        <span className="b-meta-date">
          <CalendarIcon />
          <time dateTime={post.publishedAt.replace(" ", "T")}>{formatDate(post.publishedAt)}</time>
        </span>
      ) : null}
      {comments !== undefined ? (
        <a className="b-meta-comments" href="#comments">
          {comments === 0 ? "No Comments" : comments === 1 ? "1 Comment" : `${comments} Comments`}
        </a>
      ) : null}
    </div>
  );
}

export function PostImage({ post, eager = false }: { post: PostSummary; eager?: boolean }) {
  const img = post.image;
  return (
    <Link className={`b-thumb${img ? "" : " b-thumb--empty"}`} href={postPath(post)} tabIndex={-1} aria-hidden="true">
      {img ? (
        <img
          src={u(mediaPath(img.path, 640))}
          srcSet={mediaSrcSet(img.path, img.width, [320, 640, 960], u)}
          sizes="(max-width: 767px) calc(100vw - 60px), 260px"
          alt=""
          width={img.width ?? undefined}
          height={img.height ?? undefined}
          loading={eager ? "eager" : "lazy"}
        />
      ) : null}
    </Link>
  );
}

/** A post in a list: image, categories, title, excerpt, author and date. */
export function PostRow({ post, eager = false }: { post: PostSummary; eager?: boolean }) {
  return (
    <article className="b-card b-row">
      <PostImage post={post} eager={eager} />
      <div className="b-row-body">
        <Chips terms={post.categories} />
        <h3 className="b-title">
          <Link href={postPath(post)}>{post.title}</Link>
        </h3>
        <p className="b-excerpt">{post.excerpt}</p>
        <PostMeta post={post} />
      </div>
    </article>
  );
}

/** A small card ("You may have missed"). */
export function PostTile({ post }: { post: PostSummary }) {
  return (
    <article className="b-card b-tile">
      <PostImage post={post} />
      <div className="b-tile-body">
        <Chips terms={post.categories} />
        <h3 className="b-title b-title--small">
          <Link href={postPath(post)}>{post.title}</Link>
        </h3>
        <PostMeta post={post} />
      </div>
    </article>
  );
}

/** Page links: ‹ Previous 1 2 3 Next ›, keeping the current filters. */
export function Pagination({ page, pages, base, params }: { page: number; pages: number; base: string; params?: Record<string, string> }) {
  if (pages <= 1) return null;
  const href = (n: number) => {
    const q = new URLSearchParams(params ?? {});
    if (n > 1) q.set("page", String(n));
    else q.delete("page");
    const s = q.toString();
    return `${base}${s ? `?${s}` : ""}`;
  };
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2);
  return (
    <nav className="b-pagination" aria-label="Pages">
      {page > 1 ? <Link href={href(page - 1)} rel="prev">‹ Previous</Link> : null}
      {nums.map((n, i) => (
        <span key={n} className="b-page">
          {i > 0 && n - nums[i - 1] > 1 ? <span className="b-page-gap">…</span> : null}
          {n === page ? <span aria-current="page">{n}</span> : <Link href={href(n)}>{n}</Link>}
        </span>
      ))}
      {page < pages ? <Link href={href(page + 1)} rel="next">Next ›</Link> : null}
    </nav>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="b-card b-empty">{children}</div>;
}
