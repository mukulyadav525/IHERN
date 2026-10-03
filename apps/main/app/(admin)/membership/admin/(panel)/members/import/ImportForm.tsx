"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { importMembersAction, type ImportState } from "@/app/(admin)/membership/admin/actions";
import { useKeepValues } from "@/components/admin/Forms";
import Result from "@/components/admin/Result";

function Buttons() {
  const { pending } = useFormStatus();
  return (
    <div className="adm-row">
      <button type="submit" name="mode" value="check" className="adm-btn adm-btn--ghost" disabled={pending}>
        {pending ? "Working…" : "Check file"}
      </button>
      <button type="submit" name="mode" value="import" className="adm-btn" disabled={pending}>
        Import
      </button>
    </div>
  );
}

/** Check first (nothing changes), then import. The chosen file stays chosen between the two. */
export default function ImportForm() {
  const [state, run] = useActionState(importMembersAction, { ok: false, message: "", error: "" } as ImportState);
  const ref = useRef<HTMLFormElement>(null);
  useKeepValues(ref);
  const router = useRouter();
  const report = state.report;
  useEffect(() => {
    if (state.ok && report && !report.dryRun) router.refresh();
  }, [state, report, router]);

  return (
    <form ref={ref} action={run} className="adm-form">
      <Result state={state} />
      {report ? (
        <div className="adm-import-report" role="status">
          <dl className="adm-facts">
            <dt>{report.dryRun ? "Would be added" : "Added"}</dt>
            <dd>{report.added}</dd>
            <dt>{report.dryRun ? "Would be updated" : "Updated"}</dt>
            <dd>{report.updated}</dd>
            <dt>Already registered, left alone</dt>
            <dd>{report.unchanged}</dd>
            <dt>Rows not imported</dt>
            <dd>{report.problems.length}</dd>
          </dl>
          {report.problems.length ? (
            <details open={report.problems.length <= 10}>
              <summary>Rows not imported, and why</summary>
              <ul className="adm-list">
                {report.problems.slice(0, 200).map((p) => (
                  <li key={`${p.line}-${p.reason}`}>Row {p.line}: {p.reason}</li>
                ))}
                {report.problems.length > 200 ? <li>… and {report.problems.length - 200} more</li> : null}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
      <label className="adm-field">
        <span>CSV file</span>
        <input type="file" name="file" accept=".csv,text/csv" required />
      </label>
      <label className="adm-field">
        <span>New members are</span>
        <select name="newStatus" defaultValue="Y">
          <option value="Y">Active</option>
          <option value="N">Inactive</option>
        </select>
        <small>Used when the file has no Status column.</small>
      </label>
      <label className="adm-check">
        <input type="checkbox" name="update" value="1" /> Update members who are already registered (same email address)
      </label>
      <Buttons />
    </form>
  );
}
