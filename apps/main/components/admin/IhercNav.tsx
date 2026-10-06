import SharedNav, { type AdminNavItem } from "@ihern/core/ui/AdminNav";

const ITEMS: AdminNavItem[] = [
  { href: "/iherc2026/admin", label: "Payments", exact: true },
  { href: "/iherc2026/admin/import", label: "Import payments" },
  { href: "/iherc2026/admin/checks", label: "Members confirmed" },
];

/** The IHERC admin's pages; People only for admins. */
export default function IhercNav({ isAdmin }: { isAdmin: boolean }) {
  return <SharedNav label="IHERC admin" items={isAdmin ? [...ITEMS, { href: "/iherc2026/admin/editors", label: "People" }] : ITEMS} />;
}
