import Link from "next/link";
import type { ReactNode } from "react";
import AdminDrawer from "./AdminDrawer";
import { initials } from "../text";

/**
 * The frame of both IHERN admin areas - the blog admin and the membership
 * admin - styled by @ihern/core/styles/admin.css:
 *
 *   the IHERN bar     the public site's floating white navbar: the IHERN
 *                     wordmark, which admin this is, links out (the IHERN
 *                     website, the blog, the other admin), who is signed in
 *                     and Sign out
 *   the side panel    that admin's own pages
 *   on phones         the bar keeps the wordmark and the public site's
 *                     nine-dot button, which opens the same black drawer as
 *                     the public site's, holding all of the above
 *   the page          #main, the target of the skip link
 *
 * The two admins differ only in what they pass in.
 */

export type AdminUser = { name: string; detail: string };
export type AdminLink = { label: string; href: string };

type BarProps = {
  section: string;
  /** the admin's own dashboard (the section label links there) */
  home: string;
  /** the main IHERN website's home page (the IHERN wordmark links there, as everywhere) */
  ihernHome: string;
  links: AdminLink[];
  user?: AdminUser;
  signOut?: ReactNode;
};

/** The IHERN bar. `menu` is the phone menu button (signed-in pages only). */
export function AdminBar({ section, home, ihernHome, links, user, signOut, menu }: BarProps & { menu?: ReactNode }) {
  return (
    <header className="adm-top">
      <div className={`adm-bar${menu ? " adm-bar--menu" : ""}`}>
        <div className="adm-brand">
          <a className="adm-wordmark" href={ihernHome} aria-label="IHERN home">
            IHERN
          </a>
          <Link className="adm-section" href={home}>
            {section}
          </Link>
        </div>
        <div className="adm-bar-end">
          {links.map((l) => (
            <a key={l.href} className="adm-bar-link" href={l.href}>
              {l.label}
            </a>
          ))}
          {user || signOut ? (
            <div className="adm-me">
              {user ? (
                <>
                  <span className="adm-avatar" aria-hidden="true">
                    {initials(user.name, user.detail)}
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
        {menu}
      </div>
    </header>
  );
}

/** A signed-in admin page: the bar (with the phone drawer), the side panel and the page. */
export function AdminShell({ navLabel, nav, children, ...bar }: BarProps & { navLabel: string; nav: ReactNode; children: ReactNode }) {
  return (
    <>
      <a className="adm-skip" href="#main">
        Skip to main content
      </a>
      <AdminBar
        {...bar}
        menu={
          <AdminDrawer label={navLabel} links={bar.links} user={bar.user} signOut={bar.signOut}>
            {nav}
          </AdminDrawer>
        }
      />
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
export function AdminGate({ wide = true, children, ...bar }: BarProps & { wide?: boolean; children: ReactNode }) {
  return (
    <>
      <AdminBar {...bar} />
      <main className="adm-gate" id="main">
        <div className={`adm-card${wide ? "" : " adm-login"}`}>{children}</div>
      </main>
    </>
  );
}
