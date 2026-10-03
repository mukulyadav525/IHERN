import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { AdminBar, AdminGate, AdminShell } from "@ihern/core/ui/AdminFrame";
import { currentAdmin } from "@/lib/admin";
import { u } from "@/lib/paths";
import { signOutAdmin } from "../actions";

export const dynamic = "force-dynamic";

const SITE = { href: u("/"), label: "View site" };

/** Every page of the panel needs a signed-in admin (page-top.php). */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const who = await currentAdmin();
  if (who === null) redirect("/membership/admin/login");
  if (who === "unavailable") {
    return (
      <AdminGate bar={<AdminBar section="Membership admin" home="/membership/admin" site={SITE} />}>
        <h1>The membership admin is unavailable</h1>
        <p>The membership database could not be reached. Please try again shortly.</p>
      </AdminGate>
    );
  }
  return (
    <AdminShell
      navLabel="Membership admin"
      nav={<AdminNav />}
      bar={
        <AdminBar
          section="Membership admin"
          home="/membership/admin"
          site={SITE}
          user={{ name: who.name || who.email, detail: who.email }}
          signOut={
            <form action={signOutAdmin}>
              <button type="submit" className="adm-me-out">Sign out</button>
            </form>
          }
        />
      }
    >
      {children}
    </AdminShell>
  );
}
