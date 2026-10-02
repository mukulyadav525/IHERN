"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { u } from "@/lib/paths";

/**
 * The blog's header: the IHERN navbar (same markup and classes as the main
 * site's, styled by ihern-theme.css), with "IHERN | Blog" as the wordmark and
 * the reader's account control at the end.
 */

export type HeaderAccount = {
  initials: string;
  name: string;
  email: string;
  subscribed: boolean;
  isEditor: boolean;
  accountUrl: string;
} | null;

type NavItem = { label: string; href: string; current: boolean };

function AccountMenu({ account, returnTo }: { account: HeaderAccount; returnTo: string }) {
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

  if (!account) {
    return (
      <a className="ihern-signin-btn" href={u(`/api/sso/login?return=${encodeURIComponent(returnTo)}`)}>
        Sign in
      </a>
    );
  }
  return (
    <div className="b-account" ref={ref}>
      <button
        type="button"
        className="b-account-toggle"
        aria-expanded={open}
        aria-haspopup="true"
        title={`${account.name} · ${account.email}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ihern-avatar" aria-hidden="true">
          {account.initials}
        </span>
        <span className="ihern-visually-hidden">My account: {account.name || account.email}</span>
      </button>
      <div className="b-account-menu" hidden={!open}>
        <p className="b-account-person">{account.name}</p>
        <p className="b-account-email">{account.email}</p>
        <a className="b-account-link" href={account.accountUrl}>
          My account
        </a>
        {account.subscribed ? (
          <span className="b-account-status">Subscribed ✓</span>
        ) : (
          <Link className="b-account-link" href="/subscribe">
            Subscribe to the blog
          </Link>
        )}
        {account.isEditor ? (
          <a className="b-account-link" href={u("/admin")}>
            Blog admin
          </a>
        ) : null}
        <a className="b-account-link b-account-link--quiet" href={u("/api/sso/logout")}>
          Sign out
        </a>
      </div>
    </div>
  );
}

function NavList({ items, account, returnTo }: { items: NavItem[]; account: HeaderAccount; returnTo: string }) {
  return (
    <ul className="nav-menu">
      {items.map((item) => (
        <li key={item.label} className={item.current ? "current-menu-item" : undefined}>
          {" "}
          {item.href.startsWith("/") ? (
            <Link href={item.href} aria-current={item.current ? "page" : undefined}>
              {item.label}
            </Link>
          ) : (
            <a href={item.href}>{item.label}</a>
          )}{" "}
        </li>
      ))}
      <li className="ihern-account-item">
        <AccountMenu account={account} returnTo={returnTo} />
      </li>
    </ul>
  );
}

export default function BlogHeader({ nav, account, mainHome }: { nav: NavItem[]; account: HeaderAccount; mainHome: string }) {
  const pathname = usePathname() || "/";
  const search = useSearchParams()?.toString();
  const returnTo = pathname + (search ? `?${search}` : "");

  useEffect(() => {
    const header = document.querySelector(".menu-sticky");
    const onScroll = () => header?.classList.toggle("sticky", window.scrollY >= 1);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") document.body.classList.remove("nav-expanded");
    };
    const toggle = (e: Event) => {
      e.preventDefault();
      document.body.classList.toggle("nav-expanded");
    };
    const togglers = Array.from(document.querySelectorAll("#nav-expander, #nav-close2, .offwrap"));
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKey);
    togglers.forEach((el) => el.addEventListener("click", toggle));
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey);
      togglers.forEach((el) => el.removeEventListener("click", toggle));
    };
  }, []);

  useEffect(() => {
    document.body.classList.remove("nav-expanded");
  }, [pathname]);

  return (
    <div className="full-width-header">
      <header id="rs-header" className="rs-header style2 header-transparent">
        <div className="menu-area menu-sticky">
          <div className="container custom">
            <div className="row-table">
              <div className="col-cell header-logo">
                <div className="logo-area b-wordmark">
                  <a href={mainHome} aria-label="IHERN home">
                    <span style={{ fontSize: "28px" }}>IHERN</span>
                  </a>
                  <Link className="b-wordmark-section" href="/">
                    Blog
                  </Link>
                </div>
              </div>
              <div className="col-cell">
                <div className="rs-menu-area">
                  <div className="main-menu">
                    <nav className="rs-menu hidden-md" aria-label="IHERN navigation">
                      <NavList items={nav} account={account} returnTo={returnTo} />
                    </nav>
                  </div>
                </div>
              </div>
              <div className="col-cell">
                <div className="expand-btn-inner">
                  <ul>
                    <li className="humburger">
                      {" "}
                      <a id="nav-expander" className="nav-expander bar" href="#" aria-label="Open menu">
                        <div className="bar">
                          {" "}
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                            <Fragment key={n}>
                              <span className={`dot${n}`}></span>{" "}
                            </Fragment>
                          ))}
                        </div>
                      </a>{" "}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <nav className="right_menu_togle mobile-navbar-menu" id="mobile-navbar-menu" aria-label="IHERN navigation (mobile)">
          <div className="close-btn">
            {" "}
            <a id="nav-close2" className="nav-close" aria-label="Close menu" role="button">
              <div className="line">
                {" "}
                <span className="line1"></span> <span className="line2"></span>{" "}
              </div>
            </a>{" "}
          </div>
          <NavList items={nav} account={account} returnTo={returnTo} />
        </nav>
      </header>
    </div>
  );
}
