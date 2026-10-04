import Link from "next/link";
import { redirect } from "next/navigation";
import ActionButton from "@/components/admin/ActionButton";
import { currentEditor } from "@/lib/admin";
import { listProspects, listSubscribers, NUDGE_DAYS, recentlyNudged, subscriberCounts, SUBSCRIBERS_PAGE } from "@/lib/subscribers";
import { u } from "@/lib/paths";
import { nudgeAction, nudgeAllAction } from "../actions";

export const metadata = { title: "Subscribers" };
export const dynamic = "force-dynamic";

type Tab = "active" | "unsubscribed" | "not";
const TABS: [Tab, string][] = [
  ["active", "Subscribed"],
  ["not", "Not subscribed"],
  ["unsubscribed", "Unsubscribed"],
];

/** Who gets the new-post emails, and who could be reminded to subscribe (blog admins only). */
export default async function SubscribersPage(props: { searchParams: Promise<{ tab?: string; q?: string; page?: string }> }) {
  const me = await currentEditor();
  if (!me || typeof me === "string" || me.role !== "admin") redirect("/admin");
  const search = await props.searchParams;
  const tab = (TABS.find(([k]) => k === search.tab)?.[0] ?? "active") as Tab;
  const q = String(search.q ?? "").slice(0, 100);
  const page = Math.max(1, Number(search.page) || 1);

  const [counts, prospects] = await Promise.all([subscriberCounts(), listProspects(tab === "not" ? q : "")]);
  const subscribers = tab === "not" ? [] : await listSubscribers(tab, q);
  if (!counts || !prospects || !subscribers) return <p className="adm-flash adm-flash--error">The database could not be reached.</p>;

  const n: Record<Tab, number> = { active: counts.active, unsubscribed: counts.unsubscribed, not: prospects.length };
  const rows = tab === "not" ? prospects : subscribers;
  const pages = Math.max(1, Math.ceil(rows.length / SUBSCRIBERS_PAGE));
  const shown = rows.slice((page - 1) * SUBSCRIBERS_PAGE, page * SUBSCRIBERS_PAGE);
  const href = (p: { tab?: Tab; q?: string; page?: number }) => {
    const sp = new URLSearchParams();
    if (p.tab && p.tab !== "active") sp.set("tab", p.tab);
    if (p.q) sp.set("q", p.q);
    if (p.page && p.page > 1) sp.set("page", String(p.page));
    const s = sp.toString();
    return `/admin/subscribers${s ? `?${s}` : ""}`;
  };
  const due = tab === "not" ? prospects.filter((p) => !recentlyNudged(p)).length : 0;

  return (
    <>
      <header className="adm-head">
        <h1>Subscribers</h1>
        <div className="adm-row">
          <a className="adm-btn adm-btn--ghost" href={u("/admin/subscribers/export")}>Export subscribers (CSV)</a>
        </div>
      </header>
      <p className="adm-muted">
        Subscribers get an email when a post is published. Members and IHERN account holders who have not subscribed can be sent a reminder; people who
        unsubscribed are never reminded.
      </p>
      <nav className="adm-tabs" aria-label="Subscribers">
        {TABS.map(([key, label]) => (
          <Link key={key} href={href({ tab: key })} className={tab === key ? "is-active" : undefined} aria-current={tab === key ? "page" : undefined}>
            {label} <span className="adm-badge">{n[key]}</span>
          </Link>
        ))}
        <form className="adm-search" action={u("/admin/subscribers")} method="get" role="search">
          {tab !== "active" ? <input type="hidden" name="tab" value={tab} /> : null}
          <input type="search" name="q" defaultValue={q} placeholder="Name or email" aria-label="Search by name or email" />
        </form>
      </nav>
      {q ? (
        <p className="adm-muted">
          {rows.length} {rows.length === 1 ? "match" : "matches"} for “{q}”. <Link href={href({ tab })}>Clear search</Link>
        </p>
      ) : null}

      {tab === "not" ? (
        <section className="adm-card adm-row adm-nudge">
          <p className="adm-muted">
            {due
              ? `${due} of them can be reminded now (anyone reminded in the last ${NUDGE_DAYS} days is left out).`
              : `Everyone here was reminded in the last ${NUDGE_DAYS} days.`}
          </p>
          {due ? (
            <ActionButton
              action={nudgeAllAction}
              label={`Remind ${due} to subscribe`}
              className="adm-btn adm-btn--small"
              confirm={`Email ${due} people, asking them to subscribe to the IHERN Blog?`}
              showMessage
            />
          ) : null}
        </section>
      ) : null}

      {!shown.length ? (
        <p className="adm-card adm-muted">{q ? "Nobody matches." : tab === "active" ? "No subscribers yet." : "Nobody here."}</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">{tab === "not" ? "Who" : tab === "active" ? "Subscribed" : "Unsubscribed"}</th>
                {tab === "not" ? <th scope="col">Last reminded</th> : null}
                {tab === "not" ? <th scope="col"><span className="adm-sr">Actions</span></th> : null}
              </tr>
            </thead>
            <tbody>
              {tab === "not"
                ? prospects.slice((page - 1) * SUBSCRIBERS_PAGE, page * SUBSCRIBERS_PAGE).map((p) => (
                    <tr key={p.email}>
                      <td className="adm-strong">{p.name || "—"}</td>
                      <td data-label="Email" className="adm-wrap">{p.email}</td>
                      <td data-label="Who">{p.kind === "member" ? "IHERN member" : "IHERN account"}</td>
                      <td data-label="Reminded" className="adm-nowrap">{p.nudgedAt ? `${p.nudgedAt.slice(0, 10)}${p.nudges > 1 ? ` (${p.nudges} times)` : ""}` : <span className="adm-muted">Never</span>}</td>
                      <td className="adm-actions">
                        <ActionButton action={nudgeAction.bind(null, p.email)} label="Send reminder" confirm={`Email ${p.email}, asking them to subscribe?`} showMessage />
                      </td>
                    </tr>
                  ))
                : subscribers.slice((page - 1) * SUBSCRIBERS_PAGE, page * SUBSCRIBERS_PAGE).map((s) => (
                    <tr key={s.email}>
                      <td className="adm-strong">{s.name || "—"}</td>
                      <td data-label="Email" className="adm-wrap">{s.email}</td>
                      <td data-label="Since" className="adm-nowrap">{s.since.slice(0, 10)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 ? (
        <nav className="adm-row adm-pager" aria-label="Pages">
          {page > 1 ? <Link className="adm-btn adm-btn--ghost adm-btn--small" href={href({ tab, q, page: page - 1 })}>← Previous</Link> : null}
          <span className="adm-muted">Page {page} of {pages}</span>
          {page < pages ? <Link className="adm-btn adm-btn--ghost adm-btn--small" href={href({ tab, q, page: page + 1 })}>Next →</Link> : null}
        </nav>
      ) : null}
    </>
  );
}
