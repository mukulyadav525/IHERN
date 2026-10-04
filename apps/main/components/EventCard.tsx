import { eventDate, eventTime, eventVenue, linkNote, paragraphs, speakerLines, type IhernEvent } from "@ihern/core/events";
import { u } from "@/lib/paths";

/** A site link ("/IHERN Poster.pdf") gets the base path; other links are used as they are. */
const href = (url: string) => (url.startsWith("/") ? u(encodeURI(url)) : url);

/** One event, as the home page has always shown them (assets/css: .event-card). */
export default function EventCard({ ev }: { ev: IhernEvent }) {
  const time = eventTime(ev.startsAt, ev.endsAt);
  const speakers = speakerLines(ev.speakers);
  const links = [...(ev.joinUrl ? [{ label: ev.joinLabel || "Join", url: ev.joinUrl }] : []), ...ev.links];
  return (
    <div className="sec-title2 mb-30 event-card" id={`event-${ev.id}`}>
      {ev.tag ? <p className="event-badge">{ev.tag}</p> : null}
      <h3>{ev.title}</h3>
      {paragraphs(ev.description).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <dl className="event-meta">
        {ev.startsAt ? (
          <>
            <dt>Date</dt>
            <dd>{eventDate(ev.startsAt)}</dd>
          </>
        ) : null}
        {time ? (
          <>
            <dt>Time</dt>
            <dd>{time}</dd>
          </>
        ) : null}
        <dt>Venue</dt>
        <dd>{eventVenue(ev)}</dd>
      </dl>
      {speakers.length ? (
        <p className="event-speakers">
          <strong>Speakers</strong>
          {speakers.map((s, i) => {
            // "Name, position, organisation": the name in bold.
            const cut = s.indexOf(",");
            return (
              <span key={i}>
                <br />
                {cut > 0 ? (
                  <>
                    <strong>{s.slice(0, cut)}</strong>
                    {s.slice(cut)}
                  </>
                ) : (
                  <strong>{s}</strong>
                )}
              </span>
            );
          })}
        </p>
      ) : null}
      {links.length ? (
        <p className="event-actions">
          {links.map((l, i) => {
            const note = linkNote(l.url);
            return (
              <span key={i}>
                {i ? " " : null}
                <a className="event-poster-btn" href={href(l.url)} target="_blank" rel="noopener">
                  {l.label}
                  {note ? (
                    <>
                      {" "}
                      <span className="ihern-file-note">({note})</span>
                    </>
                  ) : null}
                </a>
              </span>
            );
          })}
        </p>
      ) : null}
    </div>
  );
}
