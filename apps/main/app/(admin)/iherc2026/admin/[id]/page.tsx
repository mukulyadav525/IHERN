import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, Submit } from "@/components/admin/Forms";
import ActionButton from "@/components/admin/ActionButton";
import { checkPayment, getPayment, memberIndex } from "@/lib/iherc";
import { rupees } from "@/lib/iherc-fees";
import { askBalanceAction, resolvePaymentAction } from "../actions";

export const metadata = { title: "Payment" };
export const dynamic = "force-dynamic";

const CATEGORY_LABEL = { member: "IHERN member", student: "Student", standard: "Non-member" } as const;

/** One payment: the check, everything finance's list says, and a note. */
export default async function PaymentPage(props: { params: Promise<{ id: string }> }) {
  const id = Number((await props.params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [p, members] = await Promise.all([getPayment(id), memberIndex()]);
  if (p === "error" || !members) return <p className="adm-flash adm-flash--error">The database could not be reached.</p>;
  if (!p) notFound();
  const v = checkPayment(p, members);
  const flash = p.resolved ? "adm-flash--ok" : v.state === "ok" ? "adm-flash--ok" : v.state === "failed" ? "adm-flash--note" : "adm-flash--error";
  return (
    <>
      <header className="adm-head">
        <h1>{p.name || p.email || `Payment ${p.id}`}</h1>
        <Link className="adm-btn adm-btn--ghost" href="/iherc2026/admin">Back to payments</Link>
      </header>
      <div className={`adm-flash ${flash}`} role="status">
        <strong>
          {p.resolved ? "Sorted out." : v.state === "ok" ? "Paid the right amount." : v.state === "due" ? `Balance due: ${rupees(v.balance)}.` : v.state === "failed" ? "Not paid." : "Please check."}
        </strong>
        {v.notes.length ? (
          <ul className="adm-list">
            {v.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        ) : null}
      </div>
      <div className="adm-two">
        <section className="adm-card">
          <h2>The check</h2>
          <dl className="adm-facts">
            <dt>Category</dt><dd>{CATEGORY_LABEL[v.category]}</dd>
            <dt>IHERN member</dt>
            <dd>{v.member ? `${v.member.name}, ${v.member.number} (${v.member.email})` : "No active membership for this number or email address"}</dd>
            <dt>Fee (incl. GST)</dt><dd>{rupees(v.expected)}</dd>
            <dt>Paid</dt><dd>{p.amount === null ? "—" : rupees(p.amount)}</dd>
            <dt>Balance</dt><dd>{v.state === "due" ? rupees(v.balance) : "None"}</dd>
            <dt>Balance asked</dt><dd>{p.balanceAskedAt || "Not yet"}</dd>
          </dl>
          {v.state === "due" && p.email ? (
            <p className="adm-row">
              <ActionButton
                action={askBalanceAction.bind(null, p.id)}
                label={p.balanceAskedAt ? "Email again about the balance" : "Email about the balance"}
                className="adm-btn"
                confirm={`Email ${p.email} asking for the balance of ${rupees(v.balance)}?`}
                showMessage
              />
            </p>
          ) : null}
          <h2 style={{ marginTop: 20 }}>Note</h2>
          <ActionForm action={resolvePaymentAction}>
            <input type="hidden" name="id" value={p.id} />
            <label className="adm-field">
              <span>Note (for the admins)</span>
              <textarea name="note" rows={3} maxLength={500} defaultValue={p.note} placeholder="e.g. Paid the balance on 20 November, reference 1234" />
            </label>
            <label className="adm-check">
              <input type="checkbox" name="resolved" value="1" defaultChecked={p.resolved} /> Sorted out (no longer needs attention)
            </label>
            <Submit label="Save" />
          </ActionForm>
        </section>
        <section className="adm-card">
          <h2>From finance&apos;s list</h2>
          {/* The list's own headings are long questions: each above its answer. */}
          <dl className="iherc-raw">
            {Object.entries(p.raw).map(([k, val]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{val}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
