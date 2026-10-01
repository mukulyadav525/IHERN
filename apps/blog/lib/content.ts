import { BLOG_CONTENT_TAG, cached } from "@ihern/core/cached";
import * as blog from "@ihern/core/blog";

/**
 * The blog's public content, cached between requests.
 *
 * Every reader of a page sees the same posts, categories and archive, so they
 * are read from the database once and shared, instead of 10-15 queries per
 * page view. An editor's change clears the cache at once (refreshBlog() in the
 * admin actions revalidates CONTENT_TAG); the 60-second lifetime is only a
 * backstop, and lets scheduled posts appear within a minute of their time.
 *
 * Only public content is cached here. Who is signed in, subscriptions and a
 * reader's own pending comments are always read fresh.
 *
 * A failed read (the database unavailable) is never cached: it is returned
 * as null, as before. If a refresh fails, the last good copy keeps being
 * served (see @ihern/core/cached).
 */

export const CONTENT_TAG = BLOG_CONTENT_TAG;
const LIFETIME = { tag: CONTENT_TAG, seconds: 60 };

export const listPosts = cached("listPosts", blog.listPosts, LIFETIME);
export const getPublishedBySlug = cached("getPublishedBySlug", blog.getPublishedBySlug, LIFETIME);
export const listTerms = cached("listTerms", blog.listTerms, LIFETIME);
export const archiveMonths = cached("archiveMonths", blog.archiveMonths, LIFETIME);
export const listAuthors = cached("listAuthors", blog.listAuthors, LIFETIME);
export const getTerm = cached("getTerm", blog.getTerm, LIFETIME);
export const getAuthor = cached("getAuthor", blog.getAuthor, LIFETIME);
export const approvedComments = cached("approvedComments", blog.approvedComments, LIFETIME);
/** Previous / next post; keyed by id and date only (not the whole post). */
export const adjacentPosts = cached("adjacentPosts", (id: number, publishedAt: string | null) => blog.adjacentPosts({ id, publishedAt }), LIFETIME);

export { PAGE_SIZE, type PostQuery } from "@ihern/core/blog";
