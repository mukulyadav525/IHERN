import { redirect } from "next/navigation";
import { AdminBar, AdminGate } from "@ihern/core/ui/AdminFrame";
import { currentAdmin } from "@/lib/admin";
import { u } from "@/lib/paths";
import AdminLoginForm from "./AdminLoginForm";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

/** applications/admin/index.php: staff sign-in, in the same card as the public sign-in page. */
export default async function AdminLoginPage() {
  const who = await currentAdmin();
  if (who && who !== "unavailable") redirect("/membership/admin");
  return (
    <AdminGate wide={false} bar={<AdminBar section="Membership admin" home="/membership/admin" site={{ href: u("/"), label: "View site" }} />}>
      <h1>Sign in</h1>
      <p className="adm-muted">
        For IHERN staff. Members sign in at <a href={u("/membership/login")}>Member sign in</a>.
      </p>
      <AdminLoginForm />
    </AdminGate>
  );
}
