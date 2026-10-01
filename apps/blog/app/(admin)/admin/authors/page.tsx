import { listAuthors } from "@ihern/core/blog";
import { ActionForm, Submit } from "@/components/admin/Forms";
import ActionButton from "@/components/admin/ActionButton";
import { deleteAuthorAction, saveAuthorAction } from "../actions";

export const metadata = { title: "Authors" };
export const dynamic = "force-dynamic";

/** The people posts are credited to, with the short bio shown under each post. */
export default async function AuthorsPage() {
  const authors = await listAuthors();
  return (
    <>
      <header className="adm-head"><h1>Authors</h1></header>
      <section className="adm-card">
        <h2>Add an author</h2>
        <ActionForm action={saveAuthorAction} reset>
          <label className="adm-field"><span>Name</span><input name="name" required maxLength={190} /></label>
          <label className="adm-field"><span>Short bio <em>(shown under their posts)</em></span><textarea name="bio" rows={3} maxLength={3000} /></label>
          <Submit label="Add author" />
        </ActionForm>
      </section>
      {!authors ? (
        <p className="adm-flash adm-flash--error">The database could not be reached.</p>
      ) : (
        authors.map((a) => (
          <section key={a.id} className="adm-card">
            <ActionForm action={saveAuthorAction}>
              <input type="hidden" name="id" value={a.id} />
              <div className="adm-grid2">
                <label className="adm-field"><span>Name</span><input name="name" defaultValue={a.name} required maxLength={190} /></label>
                <label className="adm-field"><span>Address</span><input name="slug" defaultValue={a.slug} maxLength={190} /></label>
              </div>
              <label className="adm-field"><span>Short bio</span><textarea name="bio" rows={3} defaultValue={a.bio} maxLength={3000} /></label>
              <div className="adm-row">
                <Submit label="Save" />
                <span className="adm-muted">{a.count} published {a.count === 1 ? "post" : "posts"}</span>
                <ActionButton action={deleteAuthorAction.bind(null, a.id)} label="Delete author" className="adm-link adm-danger" confirm={`Delete ${a.name}? Their posts stay, without an author.`} />
              </div>
            </ActionForm>
          </section>
        ))
      )}
    </>
  );
}
