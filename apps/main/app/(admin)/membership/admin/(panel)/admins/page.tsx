import { currentAdmin, listAdmins } from "@/lib/admin";
import { ActionForm, Submit } from "@/components/admin/Forms";
import ActionButton from "@/components/admin/ActionButton";
import { inviteAdminAction, removeAdminAction, resendInviteAction, setAdminActiveAction } from "../../actions";

export const metadata = { title: "Admin users" };
export const dynamic = "force-dynamic";

/** adAdminUser.php: who can sign in to this panel. New admins are added by email and invited. */
export default async function AdminsPage() {
  const [me, admins] = await Promise.all([currentAdmin(), listAdmins()]);
  if (!admins || !me || me === "unavailable") return <p className="adm-flash adm-flash--error">The membership database could not be reached.</p>;
  return (
    <>
      <header className="adm-head"><h1>Admin users</h1></header>
      <section className="adm-card">
        <h2>Add an admin</h2>
        <p className="adm-muted">
          Just their email address: the one they joined IHERN with, as only IHERN members can be admins. They are emailed an invitation link, and come in
          with their IHERN account for that address. No admin password is needed. Admins can also use the events admin. Deactivating or removing someone
          sends no email.
        </p>
        <ActionForm action={inviteAdminAction} reset className="adm-form adm-form--inline">
          <label className="adm-field"><span>Email</span><input type="email" name="email" required maxLength={100} autoComplete="off" /></label>
          <Submit label="Add and invite" pendingLabel="Inviting…" />
        </ActionForm>
      </section>
      <div className="adm-table-wrap">
      <table className="adm-table adm-table--wrap-actions">
        <thead><tr><th scope="col">Admin</th><th scope="col">Signs in with</th><th scope="col">Added</th><th scope="col">Status</th><th scope="col"><span className="adm-sr">Actions</span></th></tr></thead>
        <tbody>
          {admins.map((a) => (
            <tr key={a.id}>
              <td>
                <div className="adm-strong adm-wrap">{a.name || a.email}</div>
                {a.name ? <div className="adm-muted adm-wrap">{a.email}</div> : null}
                {a.mobile ? <div className="adm-muted">{a.mobile}</div> : null}
              </td>
              <td data-label="Signs in with">{a.linked ? "IHERN account" : a.invited ? <span className="adm-muted">Invitation sent</span> : "Admin password"}</td>
              <td className="adm-nowrap" data-label="Added">{a.added.slice(0, 10)}</td>
              <td data-label="Status"><span className={`adm-status ${a.active ? "is-on" : "is-off"}`}>{a.active ? "Active" : "Inactive"}</span></td>
              <td className="adm-actions">
                {a.id === me.id ? (
                  <span className="adm-muted">you</span>
                ) : (
                  <>
                    {a.active && !a.linked ? (
                      <ActionButton action={resendInviteAction.bind(null, a.id)} label={a.invited ? "Resend invitation" : "Send invitation"} showMessage />
                    ) : null}
                    {a.active ? (
                      <ActionButton action={setAdminActiveAction.bind(null, a.id, false)} label="Deactivate" confirm={`Stop ${a.email} from signing in to the membership admin? They stay on the list, and are not emailed.`} />
                    ) : (
                      <ActionButton action={setAdminActiveAction.bind(null, a.id, true)} label="Activate" />
                    )}
                    <ActionButton action={removeAdminAction.bind(null, a.id)} label="Remove" className="adm-link adm-danger" confirm={`Remove ${a.email} from the membership admin for good? They are not emailed.`} />
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
