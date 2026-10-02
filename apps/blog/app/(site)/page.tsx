import type { Metadata } from "next";
import Link from "next/link";
import { listPosts } from "@/lib/content";
import { formatDate } from "@ihern/core/text";
import { postPath } from "@ihern/core/blog-paths";
import HeroCarousel from "@/components/HeroCarousel";
import Ticker from "@/components/Ticker";
import { FilterBar } from "@/components/Listing";
import { EmptyState, PostRow, PostTile } from "@/components/PostParts";

/**
 * The blog's front page: the latest posts scrolling across the top, the
 * featured posts, the filter bar, the latest posts, and "You may have missed".
 */

export const metadata: Metadata = { alternates: { canonical: "/" } };

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const latest = await listPosts({ limit: 10 });
  if (!latest) {
    return (
      <main className="b-wrap" id="main">
        <h1 className="ihern-visually-hidden">IHERN Blog</h1>
        <EmptyState>The blog is temporarily unavailable. Please try again shortly.</EmptyState>
      </main>
    );
  }
  const posts = latest.posts;
  const slides = posts.slice(0, 5).map((p) => ({
    href: postPath(p),
    title: p.title,
    excerpt: p.excerpt,
    author: p.author?.name ?? "",
    authorHref: p.author ? `/author/${p.author.slug}` : null,
    date: formatDate(p.publishedAt),
    image: p.image ? { path: p.image.path, width: p.image.width, height: p.image.height } : null,
    categories: p.categories.map((c) => ({ slug: c.slug, name: c.name })),
  }));
  // "You May Have Missed": the four newest posts (as the WordPress theme showed).
  const missed = posts.slice(0, 4);

  return (
    <main className="b-wrap" id="main">
      <h1 className="ihern-visually-hidden">IHERN Blog</h1>
      <Ticker items={posts.slice(0, 8).map((p) => ({ href: postPath(p), title: p.title, date: formatDate(p.publishedAt), image: p.image?.path ?? null }))} />
      <HeroCarousel slides={slides} />
      <FilterBar values={{}} total={latest.total} />

      {posts.length ? (
        <section aria-label="Latest posts" className="b-list">
          {posts.map((p) => (
            <PostRow key={p.id} post={p} />
          ))}
        </section>
      ) : (
        <EmptyState>No posts yet.</EmptyState>
      )}
      {latest.total > posts.length ? (
        <p className="b-more">
          <Link className="b-btn" href="/posts?page=2">Older posts</Link>
        </p>
      ) : null}

      {missed.length ? (
        <section className="b-card b-missed" aria-labelledby="missed-title">
          <h2 className="b-section-title" id="missed-title">You May Have Missed</h2>
          <div className="b-missed-grid">
            {missed.map((p) => (
              <PostTile key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
