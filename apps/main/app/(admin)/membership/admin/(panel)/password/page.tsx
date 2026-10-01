import { ActionForm, Submit } from "@/components/admin/Forms";
import { changePasswordAction } from "../../actions";

export const metadata = { title: "Change password" };

/** changePassword.php. */
export default function PasswordPage() {
  return (
    <>
      <header className="adm-head"><h1>Change password</h1></header>
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
