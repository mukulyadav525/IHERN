import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { AdminGate, AdminShell, type AdminLink } from "@ihern/core/ui/AdminFrame";
import { isBlogEditor } from "@ihern/core/roles";
import { blogUrl } from "@ihern/core/env";
import { currentAdmin } from "@/lib/admin";
import { u } from "@/lib/paths";
import { signOutAdmin } from "../actions";

export const dynamic = "force-dynamic";

const LINKS: AdminLink[] = [
  { label: "IHERN website", href: u("/") },
  { label: "IHERN Blog", href: blogUrl() },
];

/** Every page of the panel needs a signed-in admin (page-top.php). */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const who = await currentAdmin();
  if (who === null) redirect("/membership/admin/login");
  if (who === "unavailable") {
    return (
      <AdminGate section="Membership admin" home="/membership/admin" ihernHome={u("/")} links={LINKS}>
        <h1>The membership admin is unavailable</h1>
        <p>The membership database could not be reached. Please try again shortly.</p>
      </AdminGate>
    );
  }
  const links = (await isBlogEditor(who.email)) ? [...LINKS, { label: "Blog admin", href: `${blogUrl()}/admin` }] : [...LINKS];
  // Membership admins can always use the events and IHERC admins (with their IHERN account).
  links.push({ label: "Events admin", href: u("/events/admin") });
  links.push({ label: "IHERC admin", href: u("/iherc2026/admin") });
  return (
    <AdminShell
      section="Membership admin"
      home="/membership/admin" ihernHome={u("/")}
      links={links}
      user={{ name: who.name || who.email, detail: who.email }}
      signOut={
        <form action={signOutAdmin}>
          <button type="submit" className="adm-me-out">Sign out</button>
        </form>
      }
      navLabel="Membership admin"
      nav={<AdminNav />}
    >
      {children}
    </AdminShell>
  );
}
