import { listTerms } from "@ihern/core/blog";
import { ActionForm, Submit } from "@/components/admin/Forms";
import ActionButton from "@/components/admin/ActionButton";
import { createTermAction, deleteTermAction, updateTermAction } from "../actions";
import { u } from "@/lib/paths";

export const metadata = { title: "Tags" };
export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const terms = await listTerms("tag");
  return (
    <>
      <header className="adm-head"><h1>Tags</h1></header>
      <section className="adm-card">
        <h2>Add a tag</h2>
        <ActionForm action={createTermAction} reset className="adm-form adm-form--inline">
          <input type="hidden" name="taxonomy" value="tag" />
          <label className="adm-field"><span>Name</span><input name="name" required maxLength={190} /></label>
          <label className="adm-field"><span>Address <em>(optional)</em></span><input name="slug" maxLength={190} placeholder="made from the name" /></label>
          <Submit label="Add" />
        </ActionForm>
      </section>
      {!terms ? (
        <p className="adm-flash adm-flash--error">The database could not be reached.</p>
      ) : (
        <table className="adm-table">
          <thead><tr><th scope="col">Name, address and description</th><th scope="col">Posts</th><th scope="col"><span className="adm-sr">Actions</span></th></tr></thead>
          <tbody>
            {terms.map((t) => (
              <tr key={t.id}>
                <td>
                  <ActionForm action={updateTermAction} className="adm-form adm-form--row">
                    <input type="hidden" name="id" value={t.id} />
                    <input name="name" defaultValue={t.name} aria-label="Name" required maxLength={190} />
                    <input name="slug" defaultValue={t.slug} aria-label="Address" maxLength={190} />
                    <input name="description" defaultValue={t.description} aria-label="Description" placeholder="Description (optional)" />
                    <Submit label="Save" className="adm-btn adm-btn--small" />
                  </ActionForm>
                </td>
                <td data-label="Posts">{t.count ? <a href={u(`/tag/${t.slug}`)} target="_blank" rel="noopener">{t.count}</a> : 0}</td>
                <td className="adm-actions">
                  <ActionButton action={deleteTermAction.bind(null, t.id)} label="Delete" className="adm-link adm-danger" confirm={`Delete “${t.name}”? Posts keep their other categories and tags.`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
