import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { currentEditor } from "@/lib/admin";
import { u } from "@/lib/paths";

/**
 * The blog's admin area (replaces wp-admin). Open to IHERN accounts listed
 * as blog editors; everyone else is told so. Sign-in is the reader sign-in:
 * the main site's IHERN account.
 */

export const metadata: Metadata = { title: { default: "Blog admin", template: "%s - Blog admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const who = await currentEditor();
  if (who === null) redirect("/api/sso/login?return=%2Fadmin");

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" />
        <link rel="stylesheet" href={u("/assets/css/admin.css")} />
        <link rel="icon" href={u("/assets/images/iiit-logo.png")} />
      </head>
      <body className="adm">
        {typeof who === "string" ? (
          <main className="adm-gate">
            <div className="adm-card">
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
            </div>
          </main>
        ) : (
          <div className="adm-shell">
            <aside className="adm-side">
              <Link className="adm-brand" href="/admin">
                <strong>IHERN</strong> <span>Blog admin</span>
              </Link>
              <AdminNav isAdmin={who.role === "admin"} />
              <div className="adm-me">
                <span className="adm-me-name">{who.name || who.email}</span>
                <span className="adm-me-role">{who.role === "admin" ? "Admin" : "Editor"}</span>
                <a href={u("/")}>View blog</a>
                <a href={u("/api/sso/logout")}>Sign out</a>
              </div>
            </aside>
            <main className="adm-main" id="main">
              {children}
            </main>
          </div>
        )}
      </body>
    </html>
  );
}
