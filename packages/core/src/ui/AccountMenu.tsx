"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The signed-in reader's menu at the end of the IHERN navbar, the same on
 * the main site and the blog: who is signed in, their links (My account, the
 * other site, the subscription), the admin areas they can open, Sign out.
 * Styled by assets/css/ihern-next.css (.ihern-acct-*).
 *
 *   variant "dropdown"  the avatar button in the desktop navbar, opening a panel
 *   variant "drawer"    the same contents laid out in the phone drawer
 *
 * Every href arrives complete (base path included): this runs in the browser,
 * where the sites' addresses are not known.
 */

export type AccountMenuLink = { label: string; href: string };
export type AccountMenuData = {
  initials: string;
  name: string;
  email: string;
  links: AccountMenuLink[];
  /** a status line instead of a link, e.g. "Subscribed ✓" */
  status?: string;
  admin: AccountMenuLink[];
  signOut: string;
};

function Contents({ data }: { data: AccountMenuData }) {
  return (
    <>
      <div className="ihern-acct-who">
        <span className="ihern-avatar" aria-hidden="true">
          {data.initials}
        </span>
        <span className="ihern-acct-text">
          {data.name ? <span className="ihern-acct-name">{data.name}</span> : null}
          <span className="ihern-acct-email">{data.email}</span>
        </span>
      </div>
      {/* div groups, not nested lists: the navbar's sub-menu rules hide nested <ul>s */}
      <div className="ihern-acct-list">
        {data.links.map((l) => (
          <a key={l.href + l.label} className="ihern-acct-link" href={l.href}>
            {l.label}
          </a>
        ))}
        {data.status ? <span className="ihern-acct-status">{data.status}</span> : null}
      </div>
      {data.admin.length ? (
        <div className="ihern-acct-list" role="group" aria-label="Administration">
          <span className="ihern-acct-heading" aria-hidden="true">
            Administration
          </span>
          {data.admin.map((l) => (
            <a key={l.href} className="ihern-acct-link" href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
      ) : null}
      <a className="ihern-acct-out" href={data.signOut}>
        Sign out
      </a>
    </>
  );
}

export default function AccountMenu({ data, variant = "dropdown" }: { data: AccountMenuData; variant?: "dropdown" | "drawer" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (variant === "drawer") {
    return (
      <div className="ihern-acct ihern-acct--drawer">
        <Contents data={data} />
      </div>
    );
  }
  return (
    <div className="ihern-acct" ref={ref}>
      <button
        type="button"
        className="ihern-acct-toggle"
        aria-expanded={open}
        aria-haspopup="true"
        title={data.name ? `${data.name} · ${data.email}` : data.email}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ihern-avatar" aria-hidden="true">
          {data.initials}
        </span>
        <span className="ihern-visually-hidden">My account: {data.name || data.email}</span>
      </button>
      <div className="ihern-acct-panel" hidden={!open}>
        <Contents data={data} />
      </div>
    </div>
  );
}
