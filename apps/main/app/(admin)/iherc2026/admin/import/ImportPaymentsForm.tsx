"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { importPaymentsAction, type ImportState } from "../actions";
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
export default function ImportPaymentsForm() {
  const [state, run] = useActionState(importPaymentsAction, { ok: false, message: "", error: "" } as ImportState);
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
            <dt>Payments in the file</dt>
            <dd>{report.rows}</dd>
            {!report.dryRun ? (
              <>
                <dt>Added</dt>
                <dd>{report.added}</dd>
                <dt>Already imported, left alone</dt>
                <dd>{report.known}</dd>
              </>
            ) : null}
            <dt>Columns recognised</dt>
            <dd>{report.columns.join(", ")}</dd>
            {report.missing.length ? (
              <>
                <dt>Not found</dt>
                <dd>{report.missing.join(", ")}</dd>
              </>
            ) : null}
          </dl>
          {!report.dryRun ? <p><Link className="adm-btn" href="/iherc2026/admin">See the payments</Link></p> : null}
        </div>
      ) : null}
      <label className="adm-field">
        <span>Payments file (Excel .xlsx or CSV)</span>
        <input type="file" name="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required />
      </label>
      <Buttons />
    </form>
  );
}
