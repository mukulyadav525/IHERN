import Link from "next/link";
import { findMembers, memberCounts, PAGE_SIZE } from "@/lib/admin";
import MemberTable from "@/components/admin/MemberTable";
import MemberBulk from "@/components/admin/MemberBulk";
import { updateRequests } from "@/lib/profile-update";
import { u } from "@/lib/paths";

export const metadata = { title: "Members" };
export const dynamic = "force-dynamic";

type Search = { q?: string; status?: string; page?: string };

function href(s: { q?: string; status?: string; page?: number }) {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.status) p.set("status", s.status);
  if (s.page && s.page > 1) p.set("page", String(s.page));
  const qs = p.toString();
  return `/membership/admin/members${qs ? `?${qs}` : ""}`;
}

/** Every registration: search, filter by status, and manage. */
export default async function MembersPage(props: { searchParams: Promise<Search> }) {
  const searchParams = await props.searchParams;
  const q = String(searchParams.q ?? "").slice(0, 100);
  const status = searchParams.status === "Y" || searchParams.status === "N" ? searchParams.status : "";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const [counts, found] = await Promise.all([memberCounts(), findMembers({ q, status, page })]);
  if (!counts || !found) return <p className="adm-flash adm-flash--error">The membership database could not be reached.</p>;
  const requests = await updateRequests(found.rows.map((m) => m.studentID));
  const pages = Math.max(1, Math.ceil(found.total / PAGE_SIZE));
  const tabs = [
    { key: "", label: "All", n: counts.total },
    { key: "Y", label: "Active", n: counts.active },
    { key: "N", label: "Inactive", n: counts.inactive },
  ];
  return (
    <>
      <header className="adm-head">
        <h1>Members</h1>
        <div className="adm-row">
          <a className="adm-btn" href={u("/membership/admin/export")}>Export active members (CSV)</a>
          <a className="adm-btn adm-btn--ghost" href={u("/membership/admin/export?all=1")}>Export everyone</a>
          <Link className="adm-btn adm-btn--ghost" href="/membership/admin/members/import">Import members (CSV)</Link>
        </div>
      </header>
      <div className="adm-tabs">
        {tabs.map((t) => (
          <Link key={t.key} href={href({ q, status: t.key })} className={status === t.key ? "is-active" : undefined} aria-current={status === t.key ? "page" : undefined}>
            {t.label} <span className="adm-badge">{t.n}</span>
          </Link>
        ))}
        <form className="adm-search adm-form adm-form--row" action={u("/membership/admin/members")} role="search">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <label className="adm-sr" htmlFor="member-q">Search members</label>
          <input id="member-q" type="search" name="q" defaultValue={q} placeholder="Name, email, number, organization…" />
          <button type="submit" className="adm-btn adm-btn--ghost adm-btn--small">Search</button>
        </form>
      </div>
      {q ? (
        <p className="adm-muted">
          {found.total} {found.total === 1 ? "match" : "matches"} for “{q}”. <Link href={href({ status })}>Clear search</Link>
        </p>
      ) : null}
      <MemberBulk active={counts.active} />
      {found.rows.length ? <MemberTable rows={found.rows} selectable requests={requests} /> : <p className="adm-card adm-muted">No registrations match.</p>}
      {pages > 1 ? (
        <nav className="adm-row adm-pager" aria-label="Pages">
          {page > 1 ? <Link className="adm-btn adm-btn--ghost adm-btn--small" href={href({ q, status, page: page - 1 })}>← Newer</Link> : null}
          <span className="adm-muted">Page {page} of {pages}</span>
          {page < pages ? <Link className="adm-btn adm-btn--ghost adm-btn--small" href={href({ q, status, page: page + 1 })}>Older →</Link> : null}
        </nav>
      ) : null}
    </>
  );
}
