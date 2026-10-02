import Link from "next/link";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { currentAdmin } from "@/lib/admin";
import { u } from "@/lib/paths";
import { signOutAdmin } from "../actions";

export const dynamic = "force-dynamic";

/** Every page of the panel needs a signed-in admin (page-top.php). */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const who = await currentAdmin();
  if (who === null) redirect("/membership/admin/login");
  if (who === "unavailable") {
    return (
      <main className="adm-gate">
        <div className="adm-card">
          <h1>The membership admin is unavailable</h1>
          <p>The membership database could not be reached. Please try again shortly.</p>
        </div>
      </main>
    );
  }
  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <Link className="adm-brand" href="/membership/admin">
          <strong>IHERN</strong> <span>Membership admin</span>
        </Link>
        <AdminNav />
        <div className="adm-me">
          <span className="adm-me-name">{who.name || who.email}</span>
          <span className="adm-me-role">{who.email}</span>
          <a href={u("/")}>View site</a>
          <form action={signOutAdmin}>
            <button type="submit" className="adm-me-out">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="adm-main" id="main">
        {children}
      </main>
    </div>
  );
}
