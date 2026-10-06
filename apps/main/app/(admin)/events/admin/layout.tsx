import type { Metadata } from "next";
import { redirect } from "next/navigation";
import EventsNav from "@/components/admin/EventsNav";
import { AdminGate, AdminShell, type AdminLink } from "@ihern/core/ui/AdminFrame";
import { isBlogEditor, isIhercEditor } from "@ihern/core/roles";
import { blogUrl } from "@ihern/core/env";
import { currentEventsUser } from "@/lib/events-admin";
import { u } from "@/lib/paths";

/**
 * The events admin: the events on the website's home page and Events page.
 * Open to the IHERN accounts on its list and to the membership admins
 * (lib/events-admin.ts); sign-in is the website's IHERN account sign-in.
 * Same frame and look as the blog and membership admins.
 */

export const metadata: Metadata = { title: { default: "Events admin", template: "%s - IHERN events admin" } };
export const dynamic = "force-dynamic";

const LINKS: AdminLink[] = [
  { label: "IHERN website", href: u("/") },
  { label: "IHERN Blog", href: blogUrl() },
];

export default async function EventsAdminLayout({ children }: { children: React.ReactNode }) {
  const who = await currentEventsUser();
  if (who === null) redirect("/login?return=%2Fevents%2Fadmin");
  const signOut = (
    <a className="adm-me-out" href={u("/logout")}>
      Sign out
    </a>
  );
  if (typeof who === "string") {
    return (
      <AdminGate section="Events admin" home="/events/admin" ihernHome={u("/")} links={LINKS} signOut={who === "unavailable" ? undefined : signOut}>
        <h1>{who === "unavailable" ? "The events admin is unavailable" : "No access to the events admin"}</h1>
        {who === "unavailable" ? (
          <p>The database could not be reached. Please try again shortly.</p>
        ) : (
          <p>Your IHERN account is not on the list of events editors. If you look after IHERN&apos;s events, ask an events admin or a membership admin to add your email address.</p>
        )}
        <p className="adm-row">
          <a className="adm-btn" href={u("/")}>Back to the website</a>
          <a className="adm-btn adm-btn--ghost" href={u("/logout")}>Sign out</a>
        </p>
      </AdminGate>
    );
  }
  const links = [...LINKS];
  if (who.membershipAdmin) links.push({ label: "Membership admin", href: u("/membership/admin") });
  const [blogEditor, ihercEditor] = await Promise.all([isBlogEditor(who.email), isIhercEditor(who.email)]);
  if (ihercEditor) links.push({ label: "IHERC admin", href: u("/iherc2026/admin") });
  if (blogEditor) links.push({ label: "Blog admin", href: `${blogUrl()}/admin` });
  return (
    <AdminShell
      section="Events admin"
      home="/events/admin"
      ihernHome={u("/")}
      links={links}
      user={{ name: who.name || who.email, detail: who.role === "admin" ? "Admin" : "Editor" }}
      signOut={signOut}
      navLabel="Events admin"
      nav={<EventsNav isAdmin={who.role === "admin"} />}
    >
      {children}
    </AdminShell>
  );
}
