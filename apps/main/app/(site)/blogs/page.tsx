import type { Metadata } from "next";
import Link from "next/link";
import BlogBrowser, { type BlogCard } from "@/components/BlogBrowser";
import { readSession } from "@/lib/auth";
import { blogPosts } from "@/lib/cached";
import { mediaUrl, postUrl } from "@ihern/core/blog-paths";
import { blogUrl } from "@ihern/core/env";
import { formatDate, strimwidth, timestamp } from "@ihern/core/text";
import { pageMeta } from "@/lib/seo";
import { u } from "@/lib/paths";

/**
 * Blogs (blog.php): every post from the IHERN Blog, with filters. Posts are
 * read on the blog itself; a signed-out reader sees each opening only and is
 * asked to sign in or create an IHERN account to read on. The posts come
 * straight from the blog's tables in the shared database.
 */

export const metadata: Metadata = pageMeta(
  "blogs",
  "Blogs",
  "Blogs",
  "Opinion pieces and analysis on higher education in India from the IHERN network."
);

export const dynamic = "force-dynamic";

const sorted = (xs: string[]) => Array.from(new Set(xs)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

export default async function BlogsPage() {
  const session = await readSession();
  const loggedIn = Boolean(session);
  const result = await blogPosts({ limit: 100 });
  const error = result === null;
  const base = blogUrl();

  const cards: BlogCard[] = (result?.posts ?? []).map((post) => ({
    key: String(post.id),
    title: post.title,
    excerpt: loggedIn ? strimwidth(post.excerpt, 240) : strimwidth(post.excerpt, 120),
    searchText: post.excerpt.toLowerCase(),
    link: postUrl(post),
    author: post.author?.name ?? "IHERN",
    ts: timestamp(post.publishedAt),
    dateLabel: formatDate(post.publishedAt),
    year: (post.publishedAt ?? "").slice(0, 4),
    categories: post.categories.map((c) => c.name).filter((c) => c.toLowerCase() !== "premium"),
    tags: post.tags.map((t) => t.name),
    image: post.image ? mediaUrl(post.image.path, 640) : null,
    premium: post.categories.some((c) => c.slug === "premium"),
  }));

  const filters = {
    authors: sorted(cards.map((c) => c.author)),
    categories: sorted(cards.flatMap((c) => c.categories)),
    tags: sorted(cards.flatMap((c) => c.tags)),
    years: Array.from(new Set(cards.map((c) => c.year).filter(Boolean))).sort().reverse(),
  };

  return (
    <main id="main">
      <div className="container-fluid bg-primary py-5 mb-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white animated slideInDown">Blogs</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="rs-about style2 pb-100 md-pb-70">
        <div className="container-xxl">
          <div className="row">
            <div className="col-lg-12">
              <p className="blog-intro" align="justify">
                There will be blog on Higher Education in India in which opinion pieces on HE in India will be published. Writers of op eds in
                newspapers will be encouraged to repost their articles in this blog. Other opinion articles by IHERN Fellows or Senior Fellows
                will also be published in the blog.
              </p>

              <div className="blog-account-bar">
                {session ? (
                  <>
                    <span>
                      Signed in as <strong>{session.email}</strong>
                    </span>{" "}
                    <span>&middot;</span> <a href={u("/logout")}>Sign out</a>
                  </>
                ) : (
                  <span>
                    <Link href="/login?mode=login&return=%2Fblogs">Sign in</Link> or{" "}
                    <Link href="/join">join IHERN</Link> to read posts in full
                  </span>
                )}
              </div>
            </div>
          </div>

          {error ? (
            <div className="alert alert-warning">
              Blog posts couldn&rsquo;t be loaded right now. You can still read them on the <a href={base}>IHERN Blog</a> directly.
            </div>
          ) : (
            <BlogBrowser cards={cards} filters={filters} gated={!loggedIn} blog={{ label: "IHERN Blogs", href: base }} />
          )}
        </div>
      </div>
    </main>
  );
}
