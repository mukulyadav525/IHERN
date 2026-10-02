import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin";
import { u } from "@/lib/paths";
import AdminLoginForm from "./AdminLoginForm";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

/** applications/admin/index.php: staff sign-in. */
export default async function AdminLoginPage() {
  const who = await currentAdmin();
  if (who && who !== "unavailable") redirect("/membership/admin");
  return (
    <main className="adm-gate">
      <div className="adm-card adm-login">
        <p className="adm-login-brand">
          <img src={u("/assets/images/iiit-logo.png")} alt="" width={40} height={40} />
          <span>
            <strong>IHERN</strong> Membership admin
          </span>
        </p>
        <h1>Sign in</h1>
        <p className="adm-muted">For IHERN staff. Members sign in at <a href={u("/membership/login")}>Member sign in</a>.</p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
