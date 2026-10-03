"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavItem = { href: string; label: string; exact?: boolean };

/** An admin area's own pages, with the current one marked. */
export default function AdminNav({ items, label }: { items: AdminNavItem[]; label: string }) {
  const path = usePathname() || "";
  return (
    <nav className="adm-nav" aria-label={label}>
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
