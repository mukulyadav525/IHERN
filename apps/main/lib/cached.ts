import { cached, BLOG_CONTENT_TAG, MEMBERS_TAG } from "@ihern/core/cached";
import { listPosts } from "@ihern/core/blog";
import { memberDirectory } from "./membership";

/**
 * Public data the main site shows on every visit, shared between requests.
 *
 * - The Blogs page lists the blog's posts. The blog runs as a separate app,
 *   so its editors' changes cannot clear this cache directly: it refreshes
 *   every minute.
 * - The Members page: cleared at once by a new registration or an admin
 *   change (revalidateTag(MEMBERS_TAG)), and refreshed every 5 minutes.
 */
export const blogPosts = cached("blogPosts", listPosts, { tag: BLOG_CONTENT_TAG, seconds: 60 });
export const cachedMemberDirectory = cached("memberDirectory", memberDirectory, { tag: MEMBERS_TAG, seconds: 300 });
