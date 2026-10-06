import Link from "next/link";
import { listChecks, type CheckMethod } from "@/lib/iherc";
import { rupees } from "@/lib/iherc-fees";
import { u } from "@/lib/paths";

export const metadata = { title: "Members confirmed" };
export const dynamic = "force-dynamic";

const METHOD: Record<CheckMethod, string> = { account: "Signed in", number: "Membership number", "email-phone": "Email and mobile" };

/** Members who confirmed their membership on the registration page before paying. */
export default async function ChecksPage(props: { searchParams: Promise<{ q?: string }> }) {
  const q = String((await props.searchParams).q ?? "").slice(0, 100);
  const checks = await listChecks(q);
  return (
    <>
      <header className="adm-head"><h1>Members confirmed</h1></header>
      <p className="adm-muted">
        IHERN members who confirmed their membership on the <a href={u("/iherc2026/registration")} target="_blank" rel="noopener">registration page</a> and were shown the
        member rate. It shows who is about to pay, before finance&apos;s list arrives; it is not a payment.
      </p>
      <nav className="adm-tabs" aria-label="Search">
        <form className="adm-search" action={u("/iherc2026/admin/checks")} method="get" role="search">
          <input type="search" name="q" defaultValue={q} placeholder="Search name, email, number" aria-label="Search members confirmed" />
        </form>
      </nav>
      {!checks ? (
        <p className="adm-flash adm-flash--error">The database could not be reached.</p>
      ) : !checks.length ? (
        <p className="adm-card adm-muted">{q ? <>No matches. <Link href="/iherc2026/admin/checks">Clear search</Link></> : "Nobody yet."}</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th scope="col">Member</th><th scope="col">Number</th><th scope="col">Confirmed by</th><th scope="col">Shown</th><th scope="col">Last</th></tr></thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id}>
                  <td><span className="adm-strong">{c.name}</span><div className="adm-muted adm-wrap">{c.email}</div></td>
                  <td className="adm-nowrap" data-label="Number">{c.number}</td>
                  <td data-label="Confirmed by">{METHOD[c.method]}{c.checks > 1 ? <span className="adm-muted"> ({c.checks} times)</span> : null}</td>
                  <td className="adm-nowrap" data-label="Shown">{rupees(c.amount)}</td>
                  <td className="adm-nowrap" data-label="Last">{c.lastAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
