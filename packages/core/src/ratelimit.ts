/**
 * A small in-memory limiter for sign-in attempts and outgoing emails.
 *
 * Counts events per key (an email address, an IP) inside a time window; once a
 * key reaches the limit it is refused until its window ends. In memory, per
 * app process - right for the single process per site that
 * deploy/ecosystem.config.cjs runs. A restart clears it.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Map<string, Bucket>>();

export type Limit = { name: string; max: number; windowMs: number };

function bucketsFor(name: string): Map<string, Bucket> {
  let b = buckets.get(name);
  if (!b) {
    b = new Map();
    buckets.set(name, b);
  }
  return b;
}

/** True while this key may still try (does not count an attempt). */
export function allowed(limit: Limit, key: string): boolean {
  const b = bucketsFor(limit.name).get(key.toLowerCase());
  return !b || Date.now() >= b.resetAt || b.count < limit.max;
}

/** Counts one event for this key. */
export function hit(limit: Limit, key: string): void {
  const map = bucketsFor(limit.name);
  const k = key.toLowerCase();
  const now = Date.now();
  const b = map.get(k);
  if (!b || now >= b.resetAt) map.set(k, { count: 1, resetAt: now + limit.windowMs });
  else b.count++;
  // Keep memory bounded: drop finished windows now and then.
  if (map.size > 5000) for (const [key2, v] of map) if (now >= v.resetAt) map.delete(key2);
}

/** Forgets this key (after a successful sign-in). */
export function clear(limit: Limit, key: string): void {
  bucketsFor(limit.name).delete(key.toLowerCase());
}

/** Counts an event and says whether it was within the limit. */
export function take(limit: Limit, key: string): boolean {
  if (!allowed(limit, key)) return false;
  hit(limit, key);
  return true;
}

const MIN = 60 * 1000;
/** Wrong passwords for one address. */
export const SIGN_IN_FAILURES: Limit = { name: "sign-in", max: 8, windowMs: 15 * MIN };
/** Password reset emails to one address. */
export const RESET_EMAILS: Limit = { name: "reset-email", max: 3, windowMs: 30 * MIN };
/**
 * New accounts and membership registrations from one IP address. Generous: a
 * whole campus can share one public address (a workshop signing up at once).
 */
export const SIGN_UPS: Limit = { name: "sign-up", max: 30, windowMs: 60 * MIN };
/** Wrong passwords for one membership-admin address (staff accounts: stricter). */
export const ADMIN_SIGN_IN_FAILURES: Limit = { name: "admin-sign-in", max: 5, windowMs: 15 * MIN };
