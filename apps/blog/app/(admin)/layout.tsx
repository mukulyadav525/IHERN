import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { AdminGate, AdminShell, type AdminLink } from "@ihern/core/ui/AdminFrame";
import { isMembershipAdmin } from "@ihern/core/roles";
import { currentEditor } from "@/lib/admin";
import { u } from "@/lib/paths";
import { mainUrl } from "@/lib/site";
import "@ihern/core/styles/admin.css";

/**
 * The blog's admin area (replaces wp-admin). Open to IHERN accounts listed
 * as blog editors; everyone else is told so. Sign-in is the reader sign-in:
 * the main site's IHERN account. The frame and look are shared with the
 * membership admin (@ihern/core/ui/AdminFrame, @ihern/core/styles/admin.css).
 */

export const metadata: Metadata = { title: { default: "Blog admin", template: "%s - Blog admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";


export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const who = await currentEditor();
  if (who === null) redirect("/api/sso/login?return=%2Fadmin");
  const links: AdminLink[] = [
    { label: "IHERN website", href: mainUrl("") },
    { label: "View blog", href: u("/") },
  ];
  if (typeof who !== "string" && (await isMembershipAdmin(who.email))) links.push({ label: "Membership admin", href: mainUrl("membership/admin") });
  const signOut = (
    <a className="adm-me-out" href={u("/api/sso/logout")}>
      Sign out
    </a>
  );

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* The public site's font request, so it is already cached. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Poppins:300,400,500,600,700,800,900&display=swap" />
        <link rel="icon" href={u("/assets/images/iiit-logo.png")} />
      </head>
      <body className="adm">
        {typeof who === "string" ? (
          <AdminGate section="Blog admin" home="/admin" ihernHome={mainUrl("")} links={links} signOut={who === "unavailable" ? undefined : signOut}>
            <h1>{who === "unavailable" ? "The blog admin is unavailable" : "No access to the blog admin"}</h1>
            {who === "unavailable" ? (
              <p>The database could not be reached. Please try again shortly.</p>
            ) : (
              <p>
                Your IHERN account is not on the list of blog editors. If you write or edit for the IHERN Blog, ask a blog admin to add your email
                address.
              </p>
            )}
            <p className="adm-row">
              <a className="adm-btn" href={u("/")}>Back to the blog</a>
              <a className="adm-btn adm-btn--ghost" href={u("/api/sso/logout")}>Sign out</a>
            </p>
          </AdminGate>
        ) : (
          <AdminShell
            section="Blog admin"
            home="/admin" ihernHome={mainUrl("")}
            links={links}
            user={{ name: who.name || who.email, detail: who.role === "admin" ? "Admin" : "Editor" }}
            signOut={signOut}
            navLabel="Blog admin"
            nav={<AdminNav isAdmin={who.role === "admin"} />}
          >
            {children}
          </AdminShell>
        )}
      </body>
    </html>
  );
}
