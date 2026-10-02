/**
 * The navigation, defined once (includes/site-nav.php). The same nine items,
 * in the same order, are mirrored on the blog
 * (wp-content/themes/ihern-blog/functions.php) - change both together.
 */
export type NavKey = "home" | "about" | "initiatives" | "members" | "stc" | "sig" | "webinars" | "conferences" | "blogs";

export const NAV_ITEMS: { key: NavKey; label: string; href: string }[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "about", label: "About", href: "/about" },
  { key: "initiatives", label: "Initiatives", href: "/initiatives" },
  { key: "members", label: "Members", href: "/members" },
  { key: "stc", label: "Steering Committee", href: "/stc" },
  { key: "sig", label: "SIGs", href: "/sig" },
  { key: "webinars", label: "Webinars", href: "/#events_heading" },
  { key: "conferences", label: "Conferences", href: "/iherc2026" },
  { key: "blogs", label: "Blogs", href: "/blogs" },
];

/** Which item a path belongs to (pages outside the navigation have none). */
export function currentNavKey(pathname: string): NavKey | null {
  const p = pathname.replace(/\/+$/, "") || "/";
  const hit = NAV_ITEMS.find((i) => i.href === p && i.key !== "webinars");
  return hit ? hit.key : null;
}
