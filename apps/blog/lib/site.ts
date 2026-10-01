import { siteUrl } from "@ihern/core/env";

/** Addresses on the main IHERN site (the blog is a separate host). */
export function mainUrl(path = ""): string {
  return siteUrl() + path.replace(/^\/+/, "");
}

/**
 * The navigation: the main site's items, in its order, then "Blogs" - this
 * site. The main site defines the same list in apps/main/lib/nav.ts; change
 * both together.
 */
export function navItems(): { label: string; href: string; current: boolean }[] {
  return [
    { label: "Home", href: mainUrl(""), current: false },
    { label: "About", href: mainUrl("about"), current: false },
    { label: "Initiatives", href: mainUrl("initiatives"), current: false },
    { label: "Members", href: mainUrl("members"), current: false },
    { label: "Steering Committee", href: mainUrl("stc"), current: false },
    { label: "SIGs", href: mainUrl("sig"), current: false },
    { label: "Webinars", href: mainUrl("#events_heading"), current: false },
    { label: "Conferences", href: mainUrl("iherc2026"), current: false },
    { label: "Blogs", href: "/", current: true },
  ];
}

export const BLOG_NAME = "IHERN Blog";
export const BLOG_DESCRIPTION = "Opinion pieces and analysis on higher education in India from the India Higher Education Research Network (IHERN).";
