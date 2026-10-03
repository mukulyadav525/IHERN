"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, useEffect } from "react";
import AccountMenu, { type AccountMenuData } from "@ihern/core/ui/AccountMenu";
import { u } from "@/lib/paths";

/**
 * The blog's header: the IHERN navbar (same markup and classes as the main
 * site's, styled by ihern-theme.css), with "IHERN | Blog" as the wordmark and
 * the reader's account control at the end.
 */

export type HeaderAccount = AccountMenuData | null;

type NavItem = { label: string; href: string; current: boolean };

function Account({ account, returnTo, drawer }: { account: HeaderAccount; returnTo: string; drawer?: boolean }) {
  if (!account) {
    return (
      <a className="ihern-signin-btn" href={u(`/api/sso/login?return=${encodeURIComponent(returnTo)}`)}>
        Sign in
      </a>
    );
  }
  return <AccountMenu data={account} variant={drawer ? "drawer" : "dropdown"} />;
}

function NavList({ items, account, returnTo, drawer }: { items: NavItem[]; account: HeaderAccount; returnTo: string; drawer?: boolean }) {
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
        <Account account={account} returnTo={returnTo} drawer={drawer} />
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
          <NavList items={nav} account={account} returnTo={returnTo} drawer />
        </nav>
      </header>
    </div>
  );
}
