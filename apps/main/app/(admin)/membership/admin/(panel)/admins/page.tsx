import { currentAdmin, listAdmins } from "@/lib/admin";
import { ActionForm, Submit } from "@/components/admin/Forms";
import ActionButton from "@/components/admin/ActionButton";
import { addAdminAction, setAdminActiveAction } from "../../actions";

export const metadata = { title: "Admin users" };
export const dynamic = "force-dynamic";

/** adAdminUser.php: who can sign in to this panel. */
export default async function AdminsPage() {
  const [me, admins] = await Promise.all([currentAdmin(), listAdmins()]);
  if (!admins || !me || me === "unavailable") return <p className="adm-flash adm-flash--error">The membership database could not be reached.</p>;
  return (
    <>
      <header className="adm-head"><h1>Admin users</h1></header>
      <section className="adm-card">
        <h2>Add an admin</h2>
        <p className="adm-muted">They sign in at this panel with this email address and password, and can change the password afterwards.</p>
        <ActionForm action={addAdminAction} reset className="adm-form adm-form--inline">
          <label className="adm-field"><span>Name</span><input name="name" required maxLength={100} /></label>
          <label className="adm-field"><span>Email</span><input type="email" name="email" required maxLength={100} autoComplete="off" /></label>
          <label className="adm-field"><span>Mobile <em>(optional)</em></span><input type="tel" name="mobile" maxLength={50} /></label>
          <label className="adm-field"><span>Password <em>(10+ characters)</em></span><input type="password" name="password" required minLength={10} autoComplete="new-password" /></label>
          <Submit label="Add admin" />
        </ActionForm>
      </section>
      <table className="adm-table">
        <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Added</th><th scope="col">Status</th><th scope="col"><span className="adm-sr">Actions</span></th></tr></thead>
        <tbody>
          {admins.map((a) => (
            <tr key={a.id}>
              <td className="adm-strong">{a.name}</td>
              <td>{a.email}{a.mobile ? <div className="adm-muted">{a.mobile}</div> : null}</td>
              <td className="adm-nowrap">{a.added.slice(0, 10)}</td>
              <td><span className={`adm-status ${a.active ? "is-on" : "is-off"}`}>{a.active ? "Active" : "Inactive"}</span></td>
              <td className="adm-actions">
                {a.id === me.id ? (
                  <span className="adm-muted">you</span>
                ) : a.active ? (
                  <ActionButton action={setAdminActiveAction.bind(null, a.id, false)} label="Deactivate" className="adm-link adm-danger" confirm={`Stop ${a.email} from signing in to the membership admin?`} />
                ) : (
                  <ActionButton action={setAdminActiveAction.bind(null, a.id, true)} label="Activate" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
