"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { animateScroll } from "@/lib/scroll";

/**
 * What the IHERC microsite's jQuery bundle did (assets/js/main.js and its
 * plugins), without jQuery:
 *
 *  - the navbar takes its scrolled style after 200px (.top-nav-collapse);
 *  - the menu button opens and closes the collapsed navigation, and following
 *    a link closes it;
 *  - on a conference home page, the in-page links scroll smoothly to their
 *    section and the link for the section in view is highlighted (onePageNav);
 *  - the back-to-top button appears after 200px and scrolls to the top;
 *  - elements marked .wow animate in when scrolled into view (WOW.js, which
 *    the pages ran with mobile: false).
 */
export default function IhercBehaviour() {
  const pathname = usePathname() || "";

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(target: Window | Element | Document, type: K | string, fn: EventListener, opts?: AddEventListenerOptions) => {
      target.addEventListener(type, fn, opts);
      cleanups.push(() => target.removeEventListener(type, fn, opts));
    };

    /* Navbar style and back-to-top */
    const nav = document.querySelector(".scrolling-navbar");
    const toTop = document.querySelector<HTMLElement>("a.back-to-top");
    const onScroll = () => {
      const y = window.scrollY;
      nav?.classList.toggle("top-nav-collapse", y > 200);
      if (toTop) toTop.style.display = y > 200 ? "" : "none";
    };
    on(window, "scroll", onScroll, { passive: true });
    onScroll();
    if (toTop) {
      on(toTop, "click", (e) => {
        e.preventDefault();
        animateScroll(0, 600);
      });
    }

    /* Collapsed navigation */
    const toggler = document.querySelector<HTMLElement>(".navbar-toggler");
    const menu = document.getElementById("navbarCollapse");
    const setOpen = (open: boolean) => {
      menu?.classList.toggle("show", open);
      toggler?.setAttribute("aria-expanded", String(open));
      toggler?.classList.toggle("collapsed", !open);
    };
    if (toggler && menu) {
      on(toggler, "click", () => setOpen(!menu.classList.contains("show")));
      menu.querySelectorAll("a").forEach((a) => on(a, "click", () => setOpen(false)));
    }

    /* One-page navigation on the conference home page */
    const isHome = /^\/iherc20\d\d\/?$/.test(pathname);
    const navList = document.querySelector(".navbar-nav");
    if (isHome && navList) {
      const links = Array.from(navList.querySelectorAll<HTMLAnchorElement>("a[href^='#']"));
      const sections = links
        .map((a) => ({ a, el: document.getElementById(a.getAttribute("href")!.slice(1)) }))
        .filter((s): s is { a: HTMLAnchorElement; el: HTMLElement } => s.el !== null);
      const mark = (a: HTMLAnchorElement) => {
        navList.querySelectorAll(".active").forEach((x) => x.classList.remove("active"));
        a.parentElement?.classList.add("active");
      };
      // While a clicked link's scroll is running, the scroll spy stands down
      // (onePageNav unbinds it for the duration).
      let clicking = false;
      sections.forEach(({ a, el }) =>
        on(a, "click", (e) => {
          e.preventDefault();
          if (a.parentElement?.classList.contains("active")) return;
          mark(a);
          clicking = true;
          animateScroll(() => el.getBoundingClientRect().top + window.scrollY, 750, () => (clicking = false));
        })
      );
      const spy = () => {
        if (clicking) return;
        const threshold = Math.round(window.innerHeight * 0.5);
        let current: HTMLAnchorElement | null = null;
        for (const { a, el } of sections) {
          if (el.getBoundingClientRect().top + window.scrollY - threshold < window.scrollY) current = a;
        }
        if (current && !current.parentElement?.classList.contains("active")) mark(current);
      };
      on(window, "scroll", spy, { passive: true });
    }

    /* WOW: animate .wow elements into view (desktop only, as configured) */
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!mobile && !reduce && "IntersectionObserver" in window) {
      const boxes = Array.from(document.querySelectorAll<HTMLElement>(".wow"));
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            io.unobserve(el);
            if (el.dataset.wowDelay) el.style.animationDelay = el.dataset.wowDelay;
            if (el.dataset.wowDuration) el.style.animationDuration = el.dataset.wowDuration;
            el.style.visibility = "visible";
            el.classList.add("animated");
          }
        },
        { threshold: 0 }
      );
      boxes.forEach((el) => {
        el.style.visibility = "hidden";
        io.observe(el);
      });
      cleanups.push(() => {
        io.disconnect();
        boxes.forEach((el) => (el.style.visibility = ""));
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [pathname]);

  return null;
}
