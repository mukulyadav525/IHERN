import { redirect } from "next/navigation";
import { formatDate } from "@ihern/core/text";
import { ActionForm, Submit } from "@/components/admin/Forms";
import ActionButton from "@/components/admin/ActionButton";
import { currentEventsUser } from "@/lib/events-admin";
import { listEventEditors } from "@/lib/events";
import { addEventEditorAction, removeEventEditorAction, setEventEditorActiveAction } from "../actions";

export const metadata = { title: "Editors" };
export const dynamic = "force-dynamic";

/** Who can use the events admin (events admins only). */
export default async function EventEditorsPage() {
  const me = await currentEventsUser();
  if (!me || typeof me === "string" || me.role !== "admin") redirect("/events/admin");
  const editors = await listEventEditors();
  return (
    <>
      <header className="adm-head"><h1>Editors</h1></header>
      <section className="adm-card">
        <h2>Give someone access</h2>
        <p className="adm-muted">
          Only IHERN members can be given access: enter the email address they joined IHERN with. They are emailed about it, and sign in with their IHERN
          account. Editors add, publish and email events; admins can also manage this list. Membership admins can always use the events admin. Deactivating
          or removing someone sends no email.
        </p>
        <ActionForm action={addEventEditorAction} reset className="adm-form adm-form--inline">
          <label className="adm-field"><span>Email</span><input type="email" name="email" required maxLength={190} autoComplete="off" /></label>
          <label className="adm-field"><span>Role</span>
            <select name="role" defaultValue="editor"><option value="editor">Editor</option><option value="admin">Admin</option></select>
          </label>
          <Submit label="Add" />
        </ActionForm>
      </section>
      {!editors ? (
        <p className="adm-flash adm-flash--error">The database could not be reached.</p>
      ) : !editors.length ? (
        <p className="adm-card adm-muted">Nobody yet besides the membership admins.</p>
      ) : (
        <table className="adm-table adm-table--wrap-actions">
          <thead><tr><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Added</th><th scope="col">Status</th><th scope="col"><span className="adm-sr">Actions</span></th></tr></thead>
          <tbody>
            {editors.map((e) => (
              <tr key={e.id}>
                <td className="adm-strong adm-wrap">{e.email}</td>
                <td data-label="Role">{e.role === "admin" ? "Admin" : "Editor"}</td>
                <td data-label="Added">{formatDate(e.createdAt)}</td>
                <td data-label="Status"><span className={`adm-status ${e.active ? "is-on" : "is-off"}`}>{e.active ? "Active" : "Inactive"}</span></td>
                <td className="adm-actions">
                  {e.email !== me.email.toLowerCase() ? (
                    <>
                      {e.active ? (
                        <ActionButton action={setEventEditorActiveAction.bind(null, e.id, false)} label="Deactivate" confirm={`Stop ${e.email} from using the events admin? They stay on the list, and are not emailed.`} />
                      ) : (
                        <ActionButton action={setEventEditorActiveAction.bind(null, e.id, true)} label="Activate" />
                      )}
                      <ActionButton action={removeEventEditorAction.bind(null, e.id)} label="Remove" className="adm-link adm-danger" confirm={`Remove ${e.email} from the events editors? They are not emailed.`} />
                    </>
                  ) : (
                    <span className="adm-muted">you</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
