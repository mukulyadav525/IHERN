import ActionButton from "@/components/admin/ActionButton";
import { listImports } from "@/lib/iherc";
import ImportPaymentsForm from "./ImportPaymentsForm";
import { deleteImportAction } from "../actions";

export const metadata = { title: "Import payments" };
export const dynamic = "force-dynamic";

/** Finance's list of payments from the payment form: checked before anything changes, and can be undone. */
export default async function ImportPaymentsPage(props: { searchParams: Promise<{ undone?: string }> }) {
  const undone = (await props.searchParams).undone;
  const imports = await listImports();
  return (
    <>
      <header className="adm-head"><h1>Import payments</h1></header>
      {undone !== undefined && /^\d+$/.test(undone) ? (
        <p className="adm-flash adm-flash--ok" role="status">Import undone: {undone} payment{undone === "1" ? "" : "s"} removed.</p>
      ) : null}
      <div className="adm-two">
        <section className="adm-card">
          <h2>Choose a file</h2>
          <ImportPaymentsForm />
        </section>
        <section className="adm-card">
          <h2>The file</h2>
          <ul className="adm-list">
            <li>The list of payments finance downloads from the payment form, as it is: an Excel file (.xlsx) or a CSV file, with a heading row.</li>
            <li>
              Columns are found by their headings, in any order: the form&apos;s own questions (Name, Email ID, Contact Number, Category, Are You An IHERN Member,
              Membership Number, Amount…) and the payment&apos;s reference, date and status when the list has them.
            </li>
            <li>Choose <strong>Check file</strong> first: it shows which columns were recognised, and changes nothing.</li>
            <li>Import the newest list whenever finance sends one: payments already imported are recognised (by their reference) and left alone.</li>
            <li>An import can be undone below, which removes the payments it added.</li>
          </ul>
        </section>
      </div>
      <section className="adm-card">
        <h2>Imports</h2>
        {!imports ? (
          <p className="adm-flash adm-flash--error">The database could not be reached.</p>
        ) : !imports.length ? (
          <p className="adm-muted">Nothing imported yet.</p>
        ) : (
          <table className="adm-table adm-table--wrap-actions">
            <thead><tr><th scope="col">File</th><th scope="col">When</th><th scope="col">By</th><th scope="col">Added</th><th scope="col"><span className="adm-sr">Actions</span></th></tr></thead>
            <tbody>
              {imports.map((i) => (
                <tr key={i.id}>
                  <td className="adm-strong adm-wrap">{i.fileName || "—"}</td>
                  <td className="adm-nowrap" data-label="When">{i.at}</td>
                  <td className="adm-wrap" data-label="By">{i.by}</td>
                  <td data-label="Added">{i.added}{i.known ? <span className="adm-muted"> ({i.known} already in)</span> : null}</td>
                  <td className="adm-actions">
                    {i.remaining ? (
                      <ActionButton
                        action={deleteImportAction.bind(null, i.id)}
                        label="Undo import"
                        className="adm-link adm-danger"
                        confirm={`Remove the ${i.remaining} payment${i.remaining === 1 ? "" : "s"} this import added, with their notes?`}
                        after={`/iherc2026/admin/import?undone=${i.remaining}`}
                      />
                    ) : <span className="adm-muted">nothing left</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
