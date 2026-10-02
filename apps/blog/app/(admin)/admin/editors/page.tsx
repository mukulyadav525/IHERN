import { redirect } from "next/navigation";
import { listEditors } from "@ihern/core/blog";
import { formatDate } from "@ihern/core/text";
import { ActionForm, Submit } from "@/components/admin/Forms";
import ActionButton from "@/components/admin/ActionButton";
import { currentEditor } from "@/lib/admin";
import { addEditorAction, removeEditorAction } from "../actions";

export const metadata = { title: "Editors" };
export const dynamic = "force-dynamic";

/** Who can use the blog admin (blog admins only). */
export default async function EditorsPage() {
  const me = await currentEditor();
  if (!me || typeof me === "string" || me.role !== "admin") redirect("/admin");
  const editors = await listEditors();
  return (
    <>
      <header className="adm-head"><h1>Editors</h1></header>
      <section className="adm-card">
        <h2>Give someone access</h2>
        <p className="adm-muted">They sign in to the blog with the IHERN account that uses this email address. Editors write and publish; admins can also manage this list.</p>
        <ActionForm action={addEditorAction} reset className="adm-form adm-form--inline">
          <label className="adm-field"><span>Email</span><input type="email" name="email" required /></label>
          <label className="adm-field"><span>Role</span>
            <select name="role" defaultValue="editor"><option value="editor">Editor</option><option value="admin">Admin</option></select>
          </label>
          <Submit label="Add" />
        </ActionForm>
      </section>
      {!editors ? (
        <p className="adm-flash adm-flash--error">The database could not be reached.</p>
      ) : (
        <table className="adm-table">
          <thead><tr><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Added</th><th scope="col"><span className="adm-sr">Actions</span></th></tr></thead>
          <tbody>
            {editors.map((e) => (
              <tr key={e.id}>
                <td>{e.email}</td>
                <td>{e.role === "admin" ? "Admin" : "Editor"}</td>
                <td>{formatDate(e.createdAt)}</td>
                <td className="adm-actions">
                  {e.email !== me.email.toLowerCase() ? (
                    <ActionButton action={removeEditorAction.bind(null, e.id)} label="Remove" className="adm-link adm-danger" confirm={`Remove ${e.email} from the blog editors?`} />
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
