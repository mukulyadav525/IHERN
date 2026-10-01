import mysql from "mysql2/promise";

/**
 * Connections to the EXISTING IHERN databases.
 *
 * The PHP site talks to two databases (includes/db-credentials.php):
 *
 *   cdnm       blog subscriber accounts, SSO codes, blog subscriptions
 *   ihern2024  the member directory and the membership / payment system
 *
 * This module uses the same two databases with the same environment variable
 * names the PHP site already recognises, so a server configured for the old
 * site is configured for this one. There is no second database and no copy of
 * the data — the existing database is the source of truth.
 *
 * Credentials come from the environment only. The PHP file carries committed
 * fallback passwords that are due for rotation; they are deliberately NOT
 * reproduced here.
 *
 * Connection failures are logged and surfaced as `null`, never echoed to the
 * browser — the same rule the PHP layer follows.
 */

export type DbName = "cdnm" | "ihern2024";

/** Values accepted as prepared-statement parameters. */
export type SqlParam = string | number | boolean | Date | null;

const pools = new Map<DbName, mysql.Pool | null>();

/**
 * Connections per database per app process (IHERN_DB_POOL_SIZE, default 10).
 * Requests share them: a page holds one only for the milliseconds a query
 * takes, so ten serve hundreds of readers. Two apps x two databases x 10 stays
 * well inside MySQL's default max_connections (151).
 */
const POOL_SIZE = Math.max(1, Number(process.env.IHERN_DB_POOL_SIZE) || 10);
/**
 * Queries waiting for a free connection beyond this many fail at once (and
 * the page says the service is unavailable) instead of piling up without end
 * behind a slow or stuck database. Large enough for a burst of hundreds of
 * signed-in readers at once (a few queries each, a few ms per query).
 */
const QUEUE_LIMIT = 1000;
/** A query that takes longer than this is abandoned (IHERN_DB_QUERY_TIMEOUT_MS). */
const QUERY_TIMEOUT_MS = Math.max(1000, Number(process.env.IHERN_DB_QUERY_TIMEOUT_MS) || 10_000);

function config(which: DbName): mysql.PoolOptions | null {
  const key = which.toUpperCase();
  const host = process.env.IHERN_DB_HOST;
  const database = process.env[`IHERN_DB_${key}_NAME`] || which;
  const user = process.env[`IHERN_DB_${key}_USER`];
  const password = process.env[`IHERN_DB_${key}_PASS`];

  // Without host/user/password we cannot connect. Returning null lets callers
  // show an honest "service unavailable" state instead of inventing data.
  if (!host || !user || password === undefined) return null;

  return {
    host,
    // Optional: a non-standard port, or the server's Unix socket (what PHP's
    // "localhost" uses) when TCP is not enabled.
    port: process.env.IHERN_DB_PORT ? Number(process.env.IHERN_DB_PORT) : undefined,
    socketPath: process.env.IHERN_DB_SOCKET || undefined,
    user,
    password,
    database,
    charset: "utf8mb4",
    // DATETIME values come back exactly as stored ("2025-10-02 21:29:59"),
    // the way PHP prints them, rather than shifted through a JS Date.
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: POOL_SIZE,
    queueLimit: QUEUE_LIMIT,
    maxIdle: Math.min(4, POOL_SIZE),
    idleTimeout: 60_000,
    connectTimeout: 8_000,
    enableKeepAlive: true,
  };
}

/** A pooled connection, or null when the database is not configured. */
export function getPool(which: DbName): mysql.Pool | null {
  if (pools.has(which)) return pools.get(which) ?? null;
  const cfg = config(which);
  if (!cfg) {
    console.warn(
      `[IHERN] Database "${which}" is not configured. Set IHERN_DB_HOST and ` +
        `IHERN_DB_${which.toUpperCase()}_USER / _PASS (see .env.example).`
    );
    pools.set(which, null);
    return null;
  }
  const pool = mysql.createPool(cfg);
  // Dates are site time: India (as WordPress stored the blog's). Set
  // IHERN_DB_TIMEZONE to change it; it applies to NOW() on every connection.
  const tz = process.env.IHERN_DB_TIMEZONE || "+05:30";
  pool.on("connection", (conn) => {
    conn.query("SET time_zone = ?", [tz]);
  });
  pools.set(which, pool);
  return pool;
}

/**
 * Runs a query and returns rows, or null if the database is unavailable.
 * Errors are logged server-side and never propagated to the browser.
 */
export async function query<T = Record<string, unknown>>(
  which: DbName,
  sql: string,
  params: SqlParam[] = []
): Promise<T[] | null> {
  const pool = getPool(which);
  if (!pool) return null;
  try {
    const [rows] = await pool.execute({ sql, values: params, timeout: QUERY_TIMEOUT_MS });
    return rows as T[];
  } catch (e) {
    console.error(`[IHERN] query on ${which} failed:`, e);
    return null;
  }
}

/** Runs a write. Returns affected/insert info, or null when unavailable. */
export async function execute(
  which: DbName,
  sql: string,
  params: SqlParam[] = []
): Promise<mysql.ResultSetHeader | null> {
  const pool = getPool(which);
  if (!pool) return null;
  try {
    const [result] = await pool.execute({ sql, values: params, timeout: QUERY_TIMEOUT_MS });
    return result as mysql.ResultSetHeader;
  } catch (e) {
    console.error(`[IHERN] write on ${which} failed:`, e);
    return null;
  }
}

/** True when the database is configured (not necessarily reachable). */
export function isConfigured(which: DbName): boolean {
  return config(which) !== null;
}
