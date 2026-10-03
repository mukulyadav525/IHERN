import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The frame of both IHERN admin areas - the blog admin and the membership
 * admin - styled by @ihern/core/styles/admin.css:
 *
 *   the IHERN bar     the public site's floating white navbar: the IHERN
 *                     wordmark, which admin this is, a link back to the
 *                     public site, who is signed in and Sign out
 *   the side panel    that admin's own pages
 *   the page          #main, the target of the skip link
 *
 * The two admins differ only in what they pass in.
 */

export type AdminUser = { name: string; detail: string };

function initials(name: string): string {
  const words = name.replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, "").split(/[\s@._-]+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase() || "?";
}

export function AdminBar({
  section,
  home,
  site,
  user,
  signOut,
}: {
  section: string;
  home: string;
  site: { href: string; label: string };
  user?: AdminUser;
  signOut?: ReactNode;
}) {
  return (
    <header className="adm-top">
      <div className="adm-bar">
        <Link className="adm-brand" href={home}>
          <span className="adm-wordmark">IHERN</span>
          <span className="adm-section">{section}</span>
        </Link>
        <div className="adm-bar-end">
          <a className="adm-bar-link" href={site.href}>
            {site.label}
          </a>
          {user || signOut ? (
            <div className="adm-me">
              {user ? (
                <>
                  <span className="adm-avatar" aria-hidden="true">
                    {initials(user.name)}
                  </span>
                  <span className="adm-me-text">
                    <span className="adm-me-name">{user.name}</span>
                    <span className="adm-me-role">{user.detail}</span>
                  </span>
                </>
              ) : null}
              {signOut}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/** A signed-in admin page: the bar, the side panel and the page. */
export function AdminShell({ bar, navLabel, nav, children }: { bar: ReactNode; navLabel: string; nav: ReactNode; children: ReactNode }) {
  return (
    <>
      <a className="adm-skip" href="#main">
        Skip to main content
      </a>
      {bar}
      <div className="adm-shell">
        <aside className="adm-side" aria-label={navLabel}>
          <p className="adm-side-title" aria-hidden="true">
            {navLabel}
          </p>
          {nav}
        </aside>
        <main className="adm-main" id="main">
          {children}
        </main>
      </div>
    </>
  );
}

/** Sign-in, no access, unavailable: the bar and one card, like the public sign-in page. */
export function AdminGate({ bar, wide = true, children }: { bar: ReactNode; wide?: boolean; children: ReactNode }) {
  return (
    <>
      {bar}
      <main className="adm-gate" id="main">
        <div className={`adm-card${wide ? "" : " adm-login"}`}>{children}</div>
      </main>
    </>
  );
}
