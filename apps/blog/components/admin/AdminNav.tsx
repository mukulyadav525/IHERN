"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/media", label: "Images & files" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/authors", label: "Authors" },
  { href: "/admin/comments", label: "Comments" },
];

export default function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname() || "";
  const items = isAdmin ? [...ITEMS, { href: "/admin/editors", label: "Editors" }] : ITEMS;
  return (
    <nav className="adm-nav" aria-label="Admin">
      {items.map((it) => {
        const active = it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/");
        return (
          <Link key={it.href} href={it.href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
