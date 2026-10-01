import Link from "next/link";
import { findMembers, memberCounts } from "@/lib/admin";
import MemberTable from "@/components/admin/MemberTable";
import { u } from "@/lib/paths";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

/** adminDashboard.php: the counts, the export, and the latest registrations. */
export default async function AdminDashboard() {
  const [counts, latest] = await Promise.all([memberCounts(), findMembers({ page: 1 })]);
  if (!counts || !latest) return <p className="adm-flash adm-flash--error">The membership database could not be reached.</p>;
  return (
    <>
      <header className="adm-head">
        <h1>Dashboard</h1>
        <div className="adm-row">
          <a className="adm-btn" href={u("/membership/admin/export")}>Export active members (CSV)</a>
          <a className="adm-btn adm-btn--ghost" href={u("/membership/admin/export?all=1")}>Export everyone</a>
        </div>
      </header>
      <div className="adm-stats">
        <Link className="adm-stat" href="/membership/admin/members?status=Y"><strong>{counts.active}</strong>Total registered members (active)</Link>
        <Link className="adm-stat" href="/membership/admin/members?status=N"><strong>{counts.inactive}</strong>Inactive</Link>
        <Link className="adm-stat" href="/membership/admin/members"><strong>{counts.total}</strong>All registrations</Link>
        <div className="adm-stat"><strong>{counts.last30}</strong>New in the last 30 days</div>
      </div>
      {counts.inactive ? (
        <p className="adm-flash adm-flash--note">
          {counts.inactive === 1 ? "1 registration is" : `${counts.inactive} registrations are`} inactive: not able to sign in, and left out of the export.{" "}
          <Link href="/membership/admin/members?status=N">Review</Link>
        </p>
      ) : null}
      <section className="adm-stack">
        <div className="adm-head">
          <h2>Latest registrations</h2>
          <Link href="/membership/admin/members">All members →</Link>
        </div>
        {latest.rows.length ? <MemberTable rows={latest.rows.slice(0, 10)} compact /> : <p className="adm-muted">No registrations yet.</p>}
      </section>
    </>
  );
}
