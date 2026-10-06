import Link from "next/link";
import ActionButton from "@/components/admin/ActionButton";
import { checkPayment, listPayments, memberIndex, type Payment, type Verdict } from "@/lib/iherc";
import { rupees } from "@/lib/iherc-fees";
import { u } from "@/lib/paths";
import { askAllBalancesAction, askBalanceAction, setResolvedAction } from "./actions";

export const metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

type Tab = "attention" | "all" | "member" | "student" | "standard" | "sorted" | "failed";

const TABS: [Tab, string][] = [
  ["attention", "Needs attention"],
  ["all", "All"],
  ["member", "Members"],
  ["student", "Students"],
  ["standard", "Non-members"],
  ["sorted", "Sorted out"],
  ["failed", "Not paid"],
];

const STATE_LABEL: Record<Verdict["state"], string> = { ok: "OK", due: "Balance due", check: "Check", failed: "Not paid" };
const STATE_CLASS: Record<Verdict["state"], string> = { ok: "is-on", due: "is-bad", check: "is-warn", failed: "is-off" };
const CATEGORY_LABEL = { member: "IHERN member", student: "Student", standard: "Non-member" } as const;

const needsAttention = (p: Payment, v: Verdict) => !p.resolved && (v.state === "due" || v.state === "check");

function inTab(tab: Tab, p: Payment, v: Verdict): boolean {
  switch (tab) {
    case "attention": return needsAttention(p, v);
    case "member": case "student": case "standard": return v.state !== "failed" && v.category === tab;
    case "sorted": return p.resolved;
    case "failed": return v.state === "failed";
    default: return true;
  }
}

/** Finance's list of payments, each checked against the member list and the fees. */
export default async function PaymentsPage(props: { searchParams: Promise<{ tab?: string; q?: string; asked?: string }> }) {
  const search = await props.searchParams;
  const [payments, members] = await Promise.all([listPayments(), memberIndex()]);
  if (!payments || !members) return <p className="adm-flash adm-flash--error">The database could not be reached.</p>;

  const checked = payments.map((p) => ({ p, v: checkPayment(p, members) }));
  const counts = Object.fromEntries(TABS.map(([k]) => [k, checked.filter(({ p, v }) => inTab(k, p, v)).length])) as Record<Tab, number>;
  const defaultTab: Tab = counts.attention ? "attention" : "all";
  const tab = (TABS.find(([k]) => k === search.tab)?.[0] ?? defaultTab) as Tab;
  const q = String(search.q ?? "").trim().slice(0, 100).toLowerCase();
  const shown = checked.filter(({ p, v }) => inTab(tab, p, v) && (!q || [p.name, p.email, p.membershipNo, p.ref, p.phone, p.affiliation].some((s) => s.toLowerCase().includes(q))));

  const paid = checked.filter(({ v }) => v.state !== "failed");
  const collected = paid.reduce((n, { p }) => n + (p.amount ?? 0), 0);
  const due = checked.filter(({ p, v }) => v.state === "due" && !p.resolved);
  const owed = due.reduce((n, { v }) => n + v.balance, 0);
  const toAsk = due.filter(({ p }) => !p.balanceAskedAt && p.email).length;
  const href = (t: Tab) => `/iherc2026/admin${t === defaultTab ? "" : `?tab=${t}`}`;

  return (
    <>
      <header className="adm-head">
        <h1>Payments</h1>
        <div className="adm-row">
          {payments.length ? <a className="adm-btn adm-btn--ghost" href={u("/iherc2026/admin/export")}>Download CSV</a> : null}
          <Link className="adm-btn" href="/iherc2026/admin/import">Import payments</Link>
        </div>
      </header>

      {!payments.length ? (
        <section className="adm-card">
          <h2>No payments yet</h2>
          <p className="adm-muted">
            When finance sends the list of payments from the payment form (Excel or CSV), import it here. Every payment is then checked: is the person an IHERN
            member or a student, and did they pay the right amount? Until then, <Link href="/iherc2026/admin/checks">Members confirmed</Link> shows who confirmed their
            membership on the registration page before paying.
          </p>
          <p><Link className="adm-btn" href="/iherc2026/admin/import">Import payments</Link></p>
        </section>
      ) : (
        <>
          <div className="adm-stats">
            <Link className="adm-stat" href={href("all")}><strong>{paid.length}</strong>Payments</Link>
            <div className="adm-stat"><strong>{rupees(collected)}</strong>Collected (incl. GST)</div>
            <Link className="adm-stat" href={href("attention")}><strong>{counts.attention}</strong>Need attention</Link>
            <div className="adm-stat"><strong>{rupees(owed)}</strong>Balance due ({due.length} {due.length === 1 ? "person" : "people"})</div>
          </div>

          {search.asked && /^\d+$/.test(search.asked) ? (
            <p className="adm-flash adm-flash--ok" role="status">
              Emailing {search.asked} {search.asked === "1" ? "person" : "people"} about their balance. Each is marked “Balance asked”.
            </p>
          ) : null}

          {toAsk ? (
            <div className="adm-card adm-row">
              <p className="adm-muted" style={{ margin: 0, flex: "1 1 320px" }}>
                {toAsk} {toAsk === 1 ? "person has" : "people have"} a balance due and {toAsk === 1 ? "has" : "have"} not been emailed yet. The email gives the reason, the
                amounts and the payment form, and asks members to reply with their membership number.
              </p>
              <ActionButton
                action={askAllBalancesAction}
                label={`Email ${toAsk} about their balance`}
                className="adm-btn"
                confirm={`Email ${toAsk} ${toAsk === 1 ? "person" : "people"} asking them to pay their balance?`}
                after={`/iherc2026/admin?asked=${toAsk}`}
              />
            </div>
          ) : null}

          <nav className="adm-tabs" aria-label="Filter payments">
            {TABS.map(([key, label]) => (
              <Link key={key} href={href(key)} className={tab === key ? "is-active" : undefined} aria-current={tab === key ? "page" : undefined}>
                {label} <span className="adm-badge">{counts[key]}</span>
              </Link>
            ))}
            <form className="adm-search" action={u("/iherc2026/admin")} method="get" role="search">
              {tab !== defaultTab ? <input type="hidden" name="tab" value={tab} /> : null}
              <input type="search" name="q" defaultValue={search.q ?? ""} placeholder="Search name, email, number" aria-label="Search payments" />
            </form>
          </nav>

          {!shown.length ? (
            <p className="adm-card adm-muted">{tab === "attention" && !q ? "Nothing needs attention." : "Nothing here."}</p>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table adm-table--wrap-actions">
                <thead>
                  <tr>
                    <th scope="col">Who</th>
                    <th scope="col">Category</th>
                    <th scope="col">Paid</th>
                    <th scope="col">Fee</th>
                    <th scope="col">Check</th>
                    <th scope="col"><span className="adm-sr">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(({ p, v }) => (
                    <tr key={p.id}>
                      <td className="iherc-adm-who">
                        <Link className="adm-strong" href={`/iherc2026/admin/${p.id}`}>{p.name || p.email || `Payment ${p.id}`}</Link>
                        <div className="adm-muted adm-wrap">{p.email}</div>
                        {p.paidAt ? <div className="adm-muted">{p.paidAt}</div> : null}
                      </td>
                      <td data-label="Category">
                        {CATEGORY_LABEL[v.category]}
                        {v.member ? <div className="adm-muted adm-nowrap">{v.member.number}</div> : p.membershipNo ? <div className="adm-muted">gave “{p.membershipNo}”</div> : null}
                      </td>
                      <td className="adm-nowrap" data-label="Paid">{p.amount === null ? "—" : rupees(p.amount)}</td>
                      <td className="adm-nowrap" data-label="Fee">
                        {rupees(v.expected)}
                        {v.state === "due" ? <div className="adm-danger">{rupees(v.balance)} due</div> : null}
                      </td>
                      <td data-label="Check">
                        {p.resolved ? <span className="adm-status is-on">Sorted out</span> : <span className={`adm-status ${STATE_CLASS[v.state]}`}>{STATE_LABEL[v.state]}</span>}
                        {v.notes[0] ? <div className="adm-muted iherc-adm-note">{v.notes[0]}</div> : null}
                        {p.balanceAskedAt ? <div className="adm-muted">Balance asked {p.balanceAskedAt}</div> : null}
                        {p.note ? <div className="adm-muted">Note: {p.note}</div> : null}
                      </td>
                      <td className="adm-actions">
                        <Link className="adm-link" href={`/iherc2026/admin/${p.id}`}>Details</Link>
                        {v.state === "due" && !p.resolved && p.email ? (
                          <ActionButton
                            action={askBalanceAction.bind(null, p.id)}
                            label={p.balanceAskedAt ? "Ask again" : "Ask for balance"}
                            confirm={`Email ${p.email} asking for the balance of ${rupees(v.balance)}?`}
                            showMessage
                          />
                        ) : null}
                        {needsAttention(p, v) ? <ActionButton action={setResolvedAction.bind(null, p.id, true)} label="Mark sorted out" /> : null}
                        {p.resolved ? <ActionButton action={setResolvedAction.bind(null, p.id, false)} label="Reopen" /> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
