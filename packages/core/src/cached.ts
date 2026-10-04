import { unstable_cache } from "next/cache";

/**
 * Wraps a database read so its result is shared between requests (Next's data
 * cache) for `seconds`, or until `revalidateTag(tag)` clears it.
 *
 * For public data only - the same answer for every visitor. A failed read
 * (null: the database unavailable) is never cached and stays null for the
 * caller; if a background refresh fails, the last good copy keeps being
 * served.
 *
 * Only for code running inside the Next apps (it needs Next's cache); the
 * command-line scripts read the database directly.
 */

class Unavailable extends Error {}

export function cached<A extends unknown[], R>(
  name: string,
  read: (...args: A) => Promise<R | null>,
  opts: { tag: string; seconds: number }
): (...args: A) => Promise<R | null> {
  // When an entry expires, Next refreshes it once per request that sees it
  // stale - under load, hundreds of identical queries at the same moment.
  // Requests in this process that need the same read share one query.
  const inFlight = new Map<string, Promise<R | null>>();
  const shared = (...args: A): Promise<R | null> => {
    const key = JSON.stringify(args);
    let p = inFlight.get(key);
    if (!p) {
      p = read(...args).finally(() => inFlight.delete(key));
      inFlight.set(key, p);
    }
    return p;
  };
  const inner = unstable_cache(
    async (...args: A) => {
      const r = await shared(...args);
      if (r === null) throw new Unavailable();
      return r;
    },
    [opts.tag, name],
    { tags: [opts.tag], revalidate: opts.seconds }
  );
  return async (...args: A) => {
    try {
      return await inner(...args);
    } catch (e) {
      if (e instanceof Unavailable) return null;
      throw e;
    }
  };
}

/** The blog's public content (posts, categories, authors, archive, approved comments). */
export const BLOG_CONTENT_TAG = "blog-content";
/** The public member directory. */
export const MEMBERS_TAG = "members";
/** The published events (the home page and the Events page). */
export const EVENTS_TAG = "events";
