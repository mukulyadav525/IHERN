import { redirect } from "next/navigation";
import { AdminGate } from "@ihern/core/ui/AdminFrame";
import { blogUrl } from "@ihern/core/env";
import { accountMatchingAdmin, currentAdmin } from "@/lib/admin";
import { u } from "@/lib/paths";
import AdminLoginForm from "./AdminLoginForm";
import ActionButton from "@/components/admin/ActionButton";
import { resendOwnInviteAction } from "../actions";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

/** applications/admin/index.php: staff sign-in, in the same card as the public sign-in page. */
export default async function AdminLoginPage() {
  const who = await currentAdmin();
  if (who && who !== "unavailable") redirect("/membership/admin");
  const account = await accountMatchingAdmin();
  return (
    <AdminGate
      wide={false}
      section="Membership admin"
      home="/membership/admin"
      ihernHome={u("/")}
      links={[
        { label: "IHERN website", href: u("/") },
        { label: "IHERN Blog", href: blogUrl() },
      ]}
    >
      <h1>Sign in</h1>
      <p className="adm-muted">
        For IHERN staff. Members sign in at <a href={u("/membership/login")}>Member sign in</a>.
      </p>
      {account?.invited ? (
        <>
          <p className="adm-flash adm-flash--note">
            You are signed in to IHERN as {account.email}, and you have been invited to the membership admin. Open the link in the invitation email in
            this browser: it takes you straight in. No admin password is needed.
          </p>
          <p>
            <ActionButton action={resendOwnInviteAction} label="Email me a new invitation link" className="adm-btn" showMessage />
          </p>
        </>
      ) : (
        <>
          {account ? (
            <p className="adm-flash adm-flash--note">
              You are signed in to IHERN as {account.email}. Sign in here once with your admin password: after that, your IHERN sign-in opens the membership
              admin.
            </p>
          ) : null}
          <AdminLoginForm email={account?.email} />
        </>
      )}
    </AdminGate>
  );
}
