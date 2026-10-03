import SharedNav, { type AdminNavItem } from "@ihern/core/ui/AdminNav";

const ITEMS: AdminNavItem[] = [
  { href: "/membership/admin", label: "Dashboard", exact: true },
  { href: "/membership/admin/members", label: "Members" },
  { href: "/membership/admin/admins", label: "Admin users" },
  { href: "/membership/admin/password", label: "Change password" },
];

/** The membership admin's pages. */
export default function AdminNav() {
  return <SharedNav label="Membership admin" items={ITEMS} />;
}
