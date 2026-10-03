import SharedNav, { type AdminNavItem } from "@ihern/core/ui/AdminNav";

const ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/media", label: "Images & files" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/authors", label: "Authors" },
  { href: "/admin/comments", label: "Comments" },
];

/** The blog admin's pages; Editors only for admins. */
export default function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  return <SharedNav label="Blog admin" items={isAdmin ? [...ITEMS, { href: "/admin/editors", label: "Editors" }] : ITEMS} />;
}
