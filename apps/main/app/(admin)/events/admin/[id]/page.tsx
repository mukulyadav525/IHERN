import Link from "next/link";
import { notFound } from "next/navigation";
import EventForm from "@/components/admin/EventForm";
import ActionButton from "@/components/admin/ActionButton";
import { activeMembers, getEvent } from "@/lib/events";
import { deleteEventAction, duplicateEventAction, setEventStatusAction } from "../actions";

export const metadata = { title: "Edit event" };
export const dynamic = "force-dynamic";

export default async function EditEventPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; copied?: string }> }) {
  const [params, search] = await Promise.all([props.params, props.searchParams]);
  if (!/^\d+$/.test(params.id)) notFound();
  const id = Number(params.id);
  const [ev, members] = await Promise.all([getEvent(id), activeMembers()]);
  if (ev === "error") return <p className="adm-flash adm-flash--error">The database could not be reached.</p>;
  if (!ev) notFound();
  return (
    <>
      <header className="adm-head">
        <div>
          <p className="adm-muted"><Link href="/events/admin">← All events</Link></p>
          <h1>Edit event</h1>
        </div>
        <div className="adm-row">
          <ActionButton action={duplicateEventAction.bind(null, id)} label="Duplicate as a new draft" className="adm-btn adm-btn--ghost adm-btn--small" />
          {ev.status === "trash" ? (
            <>
              <ActionButton action={setEventStatusAction.bind(null, id, "draft")} label="Restore" className="adm-btn adm-btn--ghost adm-btn--small" />
              <ActionButton action={deleteEventAction.bind(null, id)} label="Delete permanently" className="adm-btn adm-btn--danger adm-btn--small" confirm={`Delete “${ev.title}” permanently? This cannot be undone.`} after="/events/admin?status=trash" />
            </>
          ) : (
            <ActionButton action={setEventStatusAction.bind(null, id, "trash")} label="Move to trash" className="adm-btn adm-btn--danger adm-btn--small" confirm={`Move “${ev.title}” to the trash? It comes off the website.`} after="/events/admin" />
          )}
        </div>
      </header>
      {search.saved ? <p className="adm-flash adm-flash--ok" role="status">Saved.</p> : null}
      {search.copied ? <p className="adm-flash adm-flash--ok" role="status">This is a copy, saved as a draft. Change the date and the details, then publish it.</p> : null}
      <EventForm key={ev.id} event={ev} members={members?.length ?? null} />
    </>
  );
}
