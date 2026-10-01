import Link from "next/link";
import { listAuthors, listPosts, listTerms, PAGE_SIZE, type PostQuery } from "@/lib/content";
import { EmptyState, Pagination, PostRow } from "./PostParts";
import { u } from "@/lib/paths";

/**
 * A list of posts with paging - the "All posts" page, the category, tag,
 * author and month archives, and search. `filters` adds the filter bar
 * (search, author, category, tag, year, sort), an ordinary GET form that
 * works without JavaScript.
 */

export type ListingParams = { page?: string; q?: string; author?: string; category?: string; tag?: string; year?: string; sort?: string };

export function parsePage(v: string | undefined): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export async function Listing({
  query,
  page,
  base,
  params,
  filters = false,
  empty = "No posts here yet.",
}: {
  query: PostQuery;
  page: number;
  base: string;
  params?: Record<string, string>;
  filters?: boolean;
  empty?: string;
}) {
  const result = await listPosts({ ...query, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  if (!result) return <EmptyState>The blog is temporarily unavailable. Please try again shortly.</EmptyState>;
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  return (
    <>
      {filters ? <FilterBar values={params ?? {}} total={result.total} /> : null}
      {result.posts.length ? (
        <div className="b-list">
          {result.posts.map((p, i) => (
            <PostRow key={p.id} post={p} eager={i < 2} />
          ))}
        </div>
      ) : (
        <EmptyState>{empty}</EmptyState>
      )}
      <Pagination page={page} pages={pages} base={base} params={params} />
    </>
  );
}

/** The filter bar. Submits to /posts. */
export async function FilterBar({ values, total }: { values: Record<string, string>; total?: number }) {
  const [authors, categories, tags, all] = await Promise.all([listAuthors(true), listTerms("category", true), listTerms("tag", true), listPosts({ limit: 200 })]);
  const years = Array.from(new Set((all?.posts ?? []).map((p) => (p.publishedAt ?? "").slice(0, 4)).filter(Boolean))).sort().reverse();
  const active = ["q", "author", "category", "tag", "year"].some((k) => values[k]) || (values.sort && values.sort !== "newest");
  return (
    <form className="b-card b-filters" action={u("/posts")} method="get" role="search" aria-label="Filter posts">
      <div className="b-filters-grid">
        <div className="b-field">
          <label htmlFor="f-q">Search</label>
          <input id="f-q" type="search" name="q" placeholder="Search by title or text…" defaultValue={values.q ?? ""} />
        </div>
        <div className="b-field">
          <label htmlFor="f-author">Author</label>
          <select id="f-author" name="author" defaultValue={values.author ?? ""}>
            <option value="">All authors</option>
            {(authors ?? []).map((a) => (
              <option key={a.id} value={a.slug}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="b-field">
          <label htmlFor="f-category">Category</label>
          <select id="f-category" name="category" defaultValue={values.category ?? ""}>
            <option value="">All categories</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="b-field">
          <label htmlFor="f-tag">Tag</label>
          <select id="f-tag" name="tag" defaultValue={values.tag ?? ""}>
            <option value="">All tags</option>
            {(tags ?? []).map((t) => (
              <option key={t.id} value={t.slug}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="b-field">
          <label htmlFor="f-year">Year</label>
          <select id="f-year" name="year" defaultValue={values.year ?? ""}>
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="b-field">
          <label htmlFor="f-sort">Sort by</label>
          <select id="f-sort" name="sort" defaultValue={values.sort ?? "newest"}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">Title A–Z</option>
          </select>
        </div>
      </div>
      <div className="b-filters-actions">
        {total !== undefined ? (
          <span className="b-filters-count" aria-live="polite">
            {total} {total === 1 ? "post" : "posts"}
          </span>
        ) : (
          <span />
        )}
        <span className="b-filters-buttons">
          {active ? (
            <Link className="b-btn b-btn--ghost" href="/posts">
              Clear filters
            </Link>
          ) : null}
          <button type="submit" className="b-btn">
            Apply
          </button>
        </span>
      </div>
    </form>
  );
}

/** "Category / Funding" heading for an archive page. */
export function ArchiveHeading({ kind, title, children }: { kind: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="b-card b-archive-head">
      <p className="b-archive-kind">{kind}</p>
      <h1 className="b-archive-title">{title}</h1>
      {children}
    </header>
  );
}
