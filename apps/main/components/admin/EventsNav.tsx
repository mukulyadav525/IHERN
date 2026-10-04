import SharedNav, { type AdminNavItem } from "@ihern/core/ui/AdminNav";

const ITEMS: AdminNavItem[] = [
  { href: "/events/admin", label: "Events", exact: true },
  { href: "/events/admin/new", label: "Add an event" },
];

/** The events admin's pages; Editors only for admins. */
export default function EventsNav({ isAdmin }: { isAdmin: boolean }) {
  return <SharedNav label="Events admin" items={isAdmin ? [...ITEMS, { href: "/events/admin/editors", label: "Editors" }] : ITEMS} />;
}
