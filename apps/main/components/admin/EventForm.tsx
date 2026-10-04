"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { MODES, type EventLink, type IhernEvent } from "@ihern/core/events";
import { saveEventAction, type ActionResult } from "@/app/(admin)/events/admin/actions";
import { useKeepValues } from "./Forms";
import Result from "./Result";
import { u } from "@/lib/paths";

/** Adding and editing an event: the details on the left, publishing and the members' email on the right. */

const local = (dt: string | null) => (dt ? dt.slice(0, 16).replace(" ", "T") : "");

function SaveButtons({ live, members }: { live: boolean; members: number | null }) {
  const { pending } = useFormStatus();
  return (
    <div className="adm-row">
      <button
        type="submit"
        name="intent"
        value="publish"
        className="adm-btn"
        disabled={pending}
        onClick={(e) => {
          // Publishing with the email box ticked writes to every member: say so first.
          const notify = (e.currentTarget.form?.elements.namedItem("notify") as HTMLInputElement | null)?.checked;
          if (notify && !window.confirm(`Publish, and email ${members ?? "all"} members about this event now?`)) e.preventDefault();
        }}
      >
        {pending ? "Saving…" : live ? "Update" : "Publish event"}
      </button>
      <button type="submit" name="intent" value="draft" className="adm-btn adm-btn--ghost" disabled={pending}>
        {live ? "Switch to draft" : "Save draft"}
      </button>
    </div>
  );
}

export default function EventForm({ event, members }: { event: IhernEvent | null; members: number | null }) {
  const router = useRouter();
  const [state, action] = useActionState(saveEventAction, { ok: false, message: "", error: "" } as ActionResult);
  const formRef = useRef<HTMLFormElement>(null);
  useKeepValues(formRef);
  const [links, setLinks] = useState<EventLink[]>(event?.links.length ? event.links : []);
  const live = event?.status === "published";
  const announced = Boolean(event?.notifiedAt);

  // A new event, once saved, continues at its own address; a saved file shows up in the links.
  useEffect(() => {
    if (!state.ok) return;
    if (state.id && !event) router.replace(`/events/admin/${state.id}?saved=1`);
    else {
      // The uploaded file is now one of the links: do not send it again with the next save.
      const file = formRef.current?.elements.namedItem("attach") as HTMLInputElement | null;
      if (file) file.value = "";
      router.refresh();
    }
  }, [state, event, router]);
  useEffect(() => setLinks(event?.links ?? []), [event?.links]);

  return (
    <form ref={formRef} action={action} className="adm-editor" encType="multipart/form-data">
      {/* Not name="id": a field called "id" hides the form's own id property (see PostEditor). */}
      <input type="hidden" name="event_id" value={event?.id ?? ""} />
      <div className="adm-editor-main">
        <Result state={state} />
        <div className="adm-grid2">
          <label className="adm-field">
            <span>Event tag <em>(shown above the title)</em></span>
            <input name="tag" defaultValue={event?.tag ?? ""} maxLength={100} list="event-tags" placeholder="IHERN Webinar" />
            <datalist id="event-tags">
              {["IHERN Webinar", "IHERN SIGs Webinar", "IHERN Workshop", "IHERN Conference", "IHERN Seminar"].map((t) => <option key={t} value={t} />)}
            </datalist>
          </label>
          <span />
        </div>
        <label className="adm-field">
          <span>Event title</span>
          <input name="title" className="adm-title-input" defaultValue={event?.title ?? ""} required maxLength={300} />
        </label>
        <label className="adm-field">
          <span>Description <em>(a blank line starts a new paragraph)</em></span>
          <textarea name="description" defaultValue={event?.description ?? ""} rows={7} required />
        </label>
        <label className="adm-field">
          <span>Speakers <em>(optional - one per line: “Name, position, organisation”)</em></span>
          <textarea name="speakers" defaultValue={event?.speakers ?? ""} rows={3} />
        </label>

        <fieldset className="adm-fieldset">
          <legend>Date, time and venue</legend>
          <div className="adm-grid2">
            <label className="adm-field">
              <span>Starts <em>(IST)</em></span>
              <input type="datetime-local" name="starts_at" defaultValue={local(event?.startsAt ?? null)} required />
            </label>
            <label className="adm-field">
              <span>Ends <em>(optional)</em></span>
              <input type="datetime-local" name="ends_at" defaultValue={local(event?.endsAt ?? null)} />
            </label>
            <label className="adm-field">
              <span>Mode</span>
              <select name="mode" defaultValue={event?.mode ?? "online"}>
                {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </label>
            <label className="adm-field">
              <span>Venue <em>(a place, or the platform: “Zoom”)</em></span>
              <input name="venue" defaultValue={event?.venue ?? ""} maxLength={300} />
            </label>
          </div>
        </fieldset>

        <fieldset className="adm-fieldset">
          <legend>Links</legend>
          <div className="adm-grid2">
            <label className="adm-field">
              <span>Link to join <em>(Zoom, Meet, registration…)</em></span>
              <input name="join_url" defaultValue={event?.joinUrl ?? ""} maxLength={1000} inputMode="url" placeholder="https://" />
            </label>
            <label className="adm-field">
              <span>Its button says</span>
              <input name="join_label" defaultValue={event?.joinLabel ?? ""} maxLength={100} placeholder="Join via Zoom" />
            </label>
          </div>
          <p className="adm-muted">Other links: a Google Form, a poster, the programme. A PDF or a Google Form is marked as one on the website.</p>
          {links.map((l, i) => (
            <div className="adm-link-row" key={i}>
              <label className="adm-field">
                <span>Button text</span>
                <input name="link_label" value={l.label} maxLength={100} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              </label>
              <label className="adm-field">
                <span>Address</span>
                <input name="link_url" value={l.url} maxLength={1000} inputMode="url" onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              </label>
              <button type="button" className="adm-link adm-danger" onClick={() => setLinks(links.filter((_, j) => j !== i))} aria-label={`Remove the link ${l.label || i + 1}`}>
                Remove
              </button>
            </div>
          ))}
          <p>
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--small" onClick={() => setLinks([...links, { label: "", url: "" }])}>
              Add a link
            </button>
          </p>
          <div className="adm-grid2">
            <label className="adm-field">
              <span>Or upload a file <em>(PDF, JPEG or PNG, up to 10 MB)</em></span>
              <input type="file" name="attach" accept="application/pdf,image/jpeg,image/png" />
            </label>
            <label className="adm-field">
              <span>Its button says</span>
              <input name="attach_label" maxLength={100} placeholder="View webinar poster" />
            </label>
          </div>
        </fieldset>
      </div>

      <aside className="adm-editor-side">
        <section className="adm-card">
          <h2>{live ? "Live on the website" : event?.status === "trash" ? "In the trash" : "Draft"}</h2>
          {live ? (
            <p><a href={u(`/events#event-${event!.id}`)} target="_blank" rel="noopener">View on the website ↗</a></p>
          ) : (
            <p className="adm-muted">Only the events admin sees a draft. Publish to show it on the website.</p>
          )}
          {!announced ? (
            <label className="adm-check">
              <input type="checkbox" name="notify" value="1" />
              Email all members when it goes live{members !== null ? ` (${members})` : ""}
            </label>
          ) : null}
          <SaveButtons live={live} members={members} />
        </section>
        <section className="adm-card">
          <h2>Email to members</h2>
          {announced ? (
            <p className="adm-muted">
              {event!.notifyTotal === null || event!.notifySent >= event!.notifyTotal
                ? `Sent to ${event!.notifySent} active members on ${event!.notifiedAt!.slice(0, 16)}.`
                : `Sending: ${event!.notifySent} of ${event!.notifyTotal} members so far (started ${event!.notifiedAt!.slice(0, 16)}). Reload the page to see the progress.`}
            </p>
          ) : (
            <p className="adm-muted">Not sent. Each event can be emailed to all active members once: tick the box when you publish, or use Email members on the events list.</p>
          )}
        </section>
      </aside>
    </form>
  );
}
