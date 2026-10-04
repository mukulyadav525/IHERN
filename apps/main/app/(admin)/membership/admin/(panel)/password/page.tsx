import { ActionForm, Submit } from "@/components/admin/Forms";
import { currentAdmin } from "@/lib/admin";
import { changePasswordAction } from "../../actions";

export const metadata = { title: "Change password" };
export const dynamic = "force-dynamic";

/** changePassword.php: the admin password, for admins who sign in with one. */
export default async function PasswordPage() {
  const me = await currentAdmin();
  const viaAccount = Boolean(me && me !== "unavailable" && me.viaAccount);
  return (
    <>
      <header className="adm-head"><h1>Change password</h1></header>
      {viaAccount ? (
        <p className="adm-flash adm-flash--note">
          You are signed in with your IHERN account, so you do not need an admin password. The form below changes only the separate admin password, if you
          have one.
        </p>
      ) : null}
      <section className="adm-card adm-narrow">
        <ActionForm action={changePasswordAction} reset>
          <label className="adm-field"><span>Current password</span><input type="password" name="current" required autoComplete="current-password" /></label>
          <label className="adm-field"><span>New password <em>(10+ characters)</em></span><input type="password" name="password" required minLength={10} autoComplete="new-password" /></label>
          <label className="adm-field"><span>New password again</span><input type="password" name="confirm" required minLength={10} autoComplete="new-password" /></label>
          <div className="adm-row"><Submit label="Change password" /></div>
        </ActionForm>
      </section>
    </>
  );
}
