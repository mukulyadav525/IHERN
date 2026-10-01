"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/membership/admin", label: "Dashboard", exact: true },
  { href: "/membership/admin/members", label: "Members" },
  { href: "/membership/admin/admins", label: "Admin users" },
  { href: "/membership/admin/password", label: "Change password" },
];

export default function AdminNav() {
  const path = usePathname() || "";
  return (
    <nav className="adm-nav" aria-label="Admin">
      {ITEMS.map((it) => {
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
