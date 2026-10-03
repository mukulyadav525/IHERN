"use client";

import { useMemo, useState } from "react";
import { u } from "@/lib/paths";
import FilterToggle, { HideFilters } from "@ihern/core/ui/FilterToggle";

/**
 * The blog listing with its filter bar (blog.php): search, author, category,
 * tag, year and sort, a live count, and "Clear filters". Signed-out readers
 * see each post's opening only and are asked to sign in to read on.
 */

export type BlogCard = {
  key: string;
  title: string;
  excerpt: string; // already shortened for the reader's access level
  searchText: string; // lower-case excerpt, for the search box
  link: string;
  author: string;
  ts: number; // for sorting; 0 when undated
  dateLabel: string; // "June 29, 2026"
  year: string;
  categories: string[]; // topics ("Premium" is an access flag, not a topic)
  tags: string[];
  image: string | null;
  premium: boolean;
};

export type BlogFilters = { authors: string[]; categories: string[]; tags: string[]; years: string[] };

const LOGIN = "/login?mode=login&return=%2Fblogs";

export default function BlogBrowser({ cards, filters, gated, blog }: { cards: BlogCard[]; filters: BlogFilters; gated: boolean; blog: { label: string; href: string } }) {
  const [search, setSearch] = useState("");
  const [author, setAuthor] = useState("");
  const [cat, setCat] = useState("");
  const [tag, setTag] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("newest");

  const ordered = useMemo(() => {
    const list = cards.slice();
    if (sort === "az") list.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
    else if (sort === "oldest") list.sort((a, b) => a.ts - b.ts);
    else list.sort((a, b) => b.ts - a.ts);
    return list;
  }, [cards, sort]);

  const q = search.trim().toLowerCase();
  const matches = (c: BlogCard) =>
    (!q || c.title.toLowerCase().includes(q) || c.searchText.includes(q)) &&
    (!author || c.author === author) &&
    (!year || c.year === year) &&
    (!cat || c.categories.includes(cat)) &&
    (!tag || c.tags.includes(tag));
  const visible = ordered.filter(matches).length;

  const inUse = [search.trim(), author, cat, tag, year].filter(Boolean).length + (sort !== "newest" ? 1 : 0);

  const clearAll = () => {
    setSearch("");
    setAuthor("");
    setCat("");
    setTag("");
    setYear("");
    setSort("newest");
  };

  return (
    <>
      <FilterToggle link={blog} active={inUse} panelId="blog-filters">
      <div className="blog-toolbar">
        <div className="form-row">
          <div className="fld">
            <label htmlFor="f-search">Search title</label>
            <input type="search" id="f-search" placeholder="Search by title or text…" autoComplete="off" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="fld">
            <label htmlFor="f-author">Author</label>
            <select id="f-author" value={author} onChange={(e) => setAuthor(e.target.value)}>
              <option value="">All authors</option>
              {filters.authors.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label htmlFor="f-category">Category</label>
            <select id="f-category" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">All categories</option>
              {filters.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label htmlFor="f-tag">Tag</label>
            <select id="f-tag" value={tag} onChange={(e) => setTag(e.target.value)}>
              <option value="">All tags</option>
              {filters.tags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label htmlFor="f-year">Year</label>
            <select id="f-year" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">All years</option>
              {filters.years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label htmlFor="f-sort">Sort by</label>
            <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">Title A–Z</option>
            </select>
          </div>
        </div>
        <div className="blog-toolbar-actions">
          <span className="blog-result-count" id="result-count" aria-live="polite">
            {visible} {visible === 1 ? "post" : "posts"}
          </span>
          <span className="blog-toolbar-buttons">
            <button type="button" className="btn-clear" id="btn-clear" onClick={clearAll}>
              Clear filters
            </button>
            <HideFilters className="btn-clear" />
          </span>
        </div>
      </div>
      </FilterToggle>

      <div className="blog-grid" id="blog-grid" style={visible ? undefined : { display: "none" }}>
        {ordered.map((c) => (
          <article className="blog-card" key={c.key} style={matches(c) ? undefined : { display: "none" }}>
            {c.image ? <img className="thumb" src={c.image} alt="" loading="lazy" /> : null}
            <div className="blog-card-body">
              {c.premium ? <span className="premium-badge">Premium</span> : null}

              {c.categories.length ? (
                <div className="chip-row">
                  {c.categories.map((cat) => (
                    <span className="chip" key={cat}>{cat}</span>
                  ))}
                </div>
              ) : null}

              <h2>{gated ? c.title : <a href={c.link}>{c.title}</a>}</h2>

              <div className="blog-meta">
                {c.author}
                {c.dateLabel ? <> &middot; {c.dateLabel}</> : null}
              </div>

              <p className="blog-excerpt">{c.excerpt}</p>

              {c.tags.length ? (
                <div className="chip-row">
                  {c.tags.map((t) => (
                    <span className="chip tag" key={t}>#{t}</span>
                  ))}
                </div>
              ) : null}

              {gated ? (
                <a className="card-cta locked" href={u(LOGIN)}>
                  Sign in to continue reading
                </a>
              ) : (
                <a className="card-cta" href={c.link}>
                  Continue Reading &rsaquo;
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="blog-empty" id="blog-empty" style={visible ? { display: "none" } : undefined}>
        No posts match these filters.{" "}
        <button type="button" className="btn-clear" id="btn-clear-2" onClick={clearAll}>
          Clear filters
        </button>
      </div>
    </>
  );
}
