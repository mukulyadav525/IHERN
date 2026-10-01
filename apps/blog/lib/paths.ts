/**
 * Paths to files in /public and to pages, with the deployment's base path.
 *
 * The blog normally lives at its own domain root; NEXT_PUBLIC_BASE_PATH
 * lets it be served from a sub-path instead. next/link and redirect() add
 * the base path on their own; plain <img src>, <a href> and <link href> do not, so they go
 * through u():
 *
 *   <img src={u("/wp-content/uploads/2026/06/logo.png")} />
 *
 * Safe in server and client components.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");

export function u(path: string): string {
  const p = path.startsWith("/") ? path : "/" + path;
  // The home page under a base path is "/IHERN", not "/IHERN/" (which would
  // only redirect there): "/", "/#events" and "/?x" keep that form.
  if (BASE_PATH && (p === "/" || p[1] === "#" || p[1] === "?")) return BASE_PATH + p.slice(1);
  return BASE_PATH + p;
}
