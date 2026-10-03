"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect } from "react";
import AccountMenu, { type AccountMenuData } from "@ihern/core/ui/AccountMenu";
import { NAV_ITEMS, currentNavKey } from "@/lib/nav";

/**
 * The shared site header (includes/site-header.php): the floating navbar, its
 * nine-dot drawer button and the mobile drawer, with the account control at
 * the end - "Sign in", or the reader's initials once signed in. Same markup
 * and classes as the PHP header, so assets/css/ihern-theme.css styles it the
 * same way.
 */

export type HeaderAccount = AccountMenuData | null;

function NavList({ current, account, signInHref, drawer }: { current: string | null; account: HeaderAccount; signInHref: string; drawer?: boolean }) {
  return (
    <ul className="nav-menu">
      {NAV_ITEMS.map((item) => {
        const isCurrent = item.key === current;
        return (
          <li key={item.key} className={isCurrent ? "current-menu-item" : undefined}>
            {" "}
            <Link href={item.href} aria-current={isCurrent ? "page" : undefined}>
              {item.label}
            </Link>{" "}
          </li>
        );
      })}
      <li className="ihern-account-item">
        {account ? (
          <AccountMenu data={account} variant={drawer ? "drawer" : "dropdown"} />
        ) : (
          <Link className="ihern-signin-btn" href={signInHref}>
            Sign in
          </Link>
        )}
      </li>
    </ul>
  );
}

export default function SiteHeader({ account }: { account: HeaderAccount }) {
  const pathname = usePathname() || "/";
  const current = currentNavKey(pathname);
  // Come back to the page the reader was on (the sign-in page only accepts
  // same-site paths, so this cannot be used as an open redirect).
  const signInHref = `/login?return=${encodeURIComponent(pathname)}`;

  // Sticky state and the mobile drawer (assets/js/ihern-nav.js).
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

  // A link followed inside the drawer closes it.
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
                <div className="logo-area">
                  {" "}
                  <Link href="/" aria-label="IHERN home">
                    {" "}
                    <span style={{ fontSize: "28px" }}>IHERN</span>{" "}
                  </Link>{" "}
                </div>
              </div>
              <div className="col-cell">
                <div className="rs-menu-area">
                  <div className="main-menu">
                    <nav className="rs-menu hidden-md" aria-label="IHERN navigation">
                      <NavList current={current} account={account} signInHref={signInHref} />
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
          <NavList current={current} account={account} signInHref={signInHref} drawer />
        </nav>
      </header>
    </div>
  );
}
