"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { AdminLink, AdminUser } from "./AdminFrame";
import { initials } from "../text";

/**
 * The admin areas on a phone: the public site's nine-dot button, opening the
 * public site's black drawer (admin.css .adm-drawer) with this admin's pages,
 * the links out, who is signed in and Sign out. Hidden on wider screens,
 * where the bar and the side panel show all of it.
 */
export default function AdminDrawer({
  label,
  links,
  user,
  signOut,
  children,
}: {
  label: string;
  links: AdminLink[];
  user?: AdminUser;
  signOut?: ReactNode;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const button = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  // The drawer is placed in <body>: inside the bar, whose backdrop-filter
  // makes it the box that position:fixed is measured from, it could not
  // cover the screen.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // A page chosen in the drawer closes it.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (open) {
      document.body.classList.add("adm-drawer-open");
      close.current?.focus();
    } else {
      document.body.classList.remove("adm-drawer-open");
      if (wasOpen.current) button.current?.focus();
    }
    wasOpen.current = open;
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const drawer = (
    <>
      <div className="adm-drawer-shade" hidden={!open} onClick={() => setOpen(false)} />
      <div id="adm-drawer" className={`adm-drawer${open ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label={label}>
        <button ref={close} type="button" className="adm-drawer-close" aria-label="Close menu" onClick={() => setOpen(false)}>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <p className="adm-drawer-title">{label}</p>
        {children}
        {links.length ? (
          <div className="adm-drawer-links">
            {links.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
        ) : null}
        {user ? (
          <div className="adm-drawer-me">
            <span className="adm-avatar" aria-hidden="true">
              {initials(user.name, user.detail)}
            </span>
            <span className="adm-me-text">
              <span className="adm-me-name">{user.name}</span>
              <span className="adm-me-role">{user.detail}</span>
            </span>
          </div>
        ) : null}
        {signOut ? <div className="adm-drawer-out">{signOut}</div> : null}
      </div>
    </>
  );

  return (
    <>
      <button ref={button} type="button" className="adm-menu-btn" aria-label="Open menu" aria-expanded={open} aria-controls="adm-drawer" onClick={() => setOpen(true)}>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} aria-hidden="true" />
        ))}
      </button>
      {mounted ? createPortal(drawer, document.body) : null}
    </>
  );
}
