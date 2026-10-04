import Link from "next/link";
import { eventDate, eventTime, eventVenue, isUpcoming } from "@ihern/core/events";
import ActionButton from "@/components/admin/ActionButton";
import { eventCounts, listEvents, type EventFilter } from "@/lib/events";
import { u } from "@/lib/paths";
import { announceEventAction, deleteEventAction, duplicateEventAction, setEventStatusAction } from "./actions";

export const metadata = { title: "Events" };
export const dynamic = "force-dynamic";

const TABS: [EventFilter, string][] = [
  ["upcoming", "Upcoming"],
  ["past", "Past"],
  ["draft", "Drafts"],
  ["all", "All"],
  ["trash", "Trash"],
];

/** Every event: upcoming first, with publishing, the members' email and the trash. */
export default async function EventsPage(props: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const search = await props.searchParams;
  const filter = (TABS.find(([k]) => k === search.status)?.[0] ?? "upcoming") as EventFilter;
  const q = String(search.q ?? "").slice(0, 100);
  const [counts, events] = await Promise.all([eventCounts(), listEvents(filter, q)]);
  if (!counts || !events) return <p className="adm-flash adm-flash--error">The database could not be reached.</p>;
  const href = (status: string) => `/events/admin${status === "upcoming" ? "" : `?status=${status}`}`;
  return (
    <>
      <header className="adm-head">
        <h1>Events</h1>
        <Link className="adm-btn" href="/events/admin/new">Add an event</Link>
      </header>
      <nav className="adm-tabs" aria-label="Filter events">
        {TABS.map(([key, label]) => (
          <Link key={key} href={href(key)} className={filter === key ? "is-active" : undefined} aria-current={filter === key ? "page" : undefined}>
            {label} <span className="adm-badge">{counts[key]}</span>
          </Link>
        ))}
        <form className="adm-search" action={u("/events/admin")} method="get" role="search">
          {filter !== "upcoming" ? <input type="hidden" name="status" value={filter} /> : null}
          <input type="search" name="q" defaultValue={q} placeholder="Search events" aria-label="Search events" />
        </form>
      </nav>
      {q ? (
        <p className="adm-muted">
          {events.length} {events.length === 1 ? "match" : "matches"} for “{q}”. <Link href={href(filter)}>Clear search</Link>
        </p>
      ) : null}
      {!events.length ? (
        <p className="adm-card adm-muted">
          {filter === "upcoming" && !q ? <>No upcoming events. <Link href="/events/admin/new">Add one</Link>.</> : "Nothing here."}
        </p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">When</th>
                <th scope="col">Where</th>
                <th scope="col">Members emailed</th>
                <th scope="col"><span className="adm-sr">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const live = ev.status === "published";
                const upcoming = isUpcoming(ev);
                return (
                  <tr key={ev.id}>
                    <td>
                      {ev.tag ? <div className="adm-label">{ev.tag}</div> : null}
                      <Link className="adm-strong" href={`/events/admin/${ev.id}`}>{ev.title}</Link>
                      {ev.status === "draft" ? <span className="adm-badge">Draft</span> : null}
                      {live && !upcoming ? <span className="adm-badge">Past</span> : null}
                    </td>
                    <td className="adm-nowrap" data-label="When">
                      {eventDate(ev.startsAt) || "—"}
                      <div className="adm-muted">{eventTime(ev.startsAt, ev.endsAt)}</div>
                    </td>
                    <td data-label="Where">{eventVenue(ev)}</td>
                    <td data-label="Emailed">
                      {ev.notifiedAt ? (
                        <span title={`on ${ev.notifiedAt.slice(0, 16)}`}>
                          {ev.notifySent}{ev.notifyTotal !== null && ev.notifySent < ev.notifyTotal ? ` of ${ev.notifyTotal}` : ""} ✓
                        </span>
                      ) : (
                        <span className="adm-muted">Not yet</span>
                      )}
                    </td>
                    <td className="adm-actions">
                      {ev.status !== "trash" ? <Link className="adm-link" href={`/events/admin/${ev.id}`}>Edit</Link> : null}
                      {live ? <a className="adm-link" href={u(`/events#event-${ev.id}`)} target="_blank" rel="noopener">View</a> : null}
                      {ev.status === "draft" ? (
                        <ActionButton action={setEventStatusAction.bind(null, ev.id, "published")} label="Publish" confirm={`Publish “${ev.title}” on the website?`} />
                      ) : null}
                      {live && upcoming && !ev.notifiedAt ? (
                        <ActionButton action={announceEventAction.bind(null, ev.id)} label="Email members" confirm={`Email every active member about “${ev.title}”? This is sent once per event.`} showMessage />
                      ) : null}
                      {live ? <ActionButton action={setEventStatusAction.bind(null, ev.id, "draft")} label="Unpublish" confirm={`Take “${ev.title}” off the website? It stays here as a draft.`} /> : null}
                      {ev.status !== "trash" ? <ActionButton action={duplicateEventAction.bind(null, ev.id)} label="Duplicate" /> : null}
                      {ev.status === "trash" ? (
                        <>
                          <ActionButton action={setEventStatusAction.bind(null, ev.id, "draft")} label="Restore" />
                          <ActionButton action={deleteEventAction.bind(null, ev.id)} label="Delete permanently" className="adm-link adm-danger" confirm={`Delete “${ev.title}” permanently? This cannot be undone.`} />
                        </>
                      ) : (
                        <ActionButton action={setEventStatusAction.bind(null, ev.id, "trash")} label="Trash" className="adm-link adm-danger" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
