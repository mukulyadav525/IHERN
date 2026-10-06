import type { Metadata } from "next";
import { redirect } from "next/navigation";
import IhercNav from "@/components/admin/IhercNav";
import { AdminGate, AdminShell, type AdminLink } from "@ihern/core/ui/AdminFrame";
import { isBlogEditor, isEventEditor } from "@ihern/core/roles";
import { blogUrl } from "@ihern/core/env";
import { currentIhercUser } from "@/lib/iherc-admin";
import { u } from "@/lib/paths";

/**
 * The IHERC admin: IHERC 2026 registrations and payments. The fee is paid on
 * the finance department's form; here, finance's list of payments is
 * imported and checked against the member list (lib/iherc.ts). Open to the
 * IHERN accounts on its list and to the membership admins
 * (lib/iherc-admin.ts). Same frame and look as the other admins.
 */

export const metadata: Metadata = { title: { default: "IHERC admin", template: "%s - IHERC admin" } };
export const dynamic = "force-dynamic";

const LINKS: AdminLink[] = [
  { label: "IHERN website", href: u("/") },
  { label: "IHERC 2026", href: u("/iherc2026") },
];

export default async function IhercAdminLayout({ children }: { children: React.ReactNode }) {
  const who = await currentIhercUser();
  if (who === null) redirect("/login?return=%2Fiherc2026%2Fadmin");
  const signOut = (
    <a className="adm-me-out" href={u("/logout")}>
      Sign out
    </a>
  );
  if (typeof who === "string") {
    return (
      <AdminGate section="IHERC admin" home="/iherc2026/admin" ihernHome={u("/")} links={LINKS} signOut={who === "unavailable" ? undefined : signOut}>
        <h1>{who === "unavailable" ? "The IHERC admin is unavailable" : "No access to the IHERC admin"}</h1>
        {who === "unavailable" ? (
          <p>The database could not be reached. Please try again shortly.</p>
        ) : (
          <p>Your IHERN account is not on the IHERC admin&apos;s list. If you look after IHERC registrations or payments, ask an IHERC admin or a membership admin to add your email address.</p>
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
  const [eventEditor, blogEditor] = await Promise.all([isEventEditor(who.email), isBlogEditor(who.email)]);
  if (eventEditor) links.push({ label: "Events admin", href: u("/events/admin") });
  if (blogEditor) links.push({ label: "Blog admin", href: `${blogUrl()}/admin` });
  return (
    <AdminShell
      section="IHERC admin"
      home="/iherc2026/admin"
      ihernHome={u("/")}
      links={links}
      user={{ name: who.name || who.email, detail: who.role === "admin" ? "Admin" : "Editor" }}
      signOut={signOut}
      navLabel="IHERC admin"
      nav={<IhercNav isAdmin={who.role === "admin"} />}
    >
      {children}
    </AdminShell>
  );
}
