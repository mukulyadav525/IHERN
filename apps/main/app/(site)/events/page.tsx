import type { Metadata } from "next";
import EventCard from "@/components/EventCard";
import { publishedEvents } from "@/lib/events";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  "events",
  "Events",
  "IHERN Events",
  "Webinars, workshops and conferences of the India Higher Education Research Network (IHERN): upcoming events and past ones."
);

export const dynamic = "force-dynamic";

/** Every published event: upcoming ones first, then the past ones (the home page shows the latest). */
export default async function EventsPage() {
  const events = await publishedEvents();
  return (
    <main id="main">
      <div className="container-fluid bg-primary py-5 mb-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white animated slideInDown">IHERN Events</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="rs-about style1 pt-20 pb-100 md-pb-70">
        <div className="container-xxl">
          {events === null ? (
            <p className="ihern-events-note">The events could not be loaded just now. Please try again shortly.</p>
          ) : (
            <>
              <section className="ihern-events-section" aria-labelledby="upcoming-events">
                <h2 className="ihern-events-heading" id="upcoming-events">Upcoming events</h2>
                {events.upcoming.length ? (
                  events.upcoming.map((ev) => <EventCard key={ev.id} ev={ev} />)
                ) : (
                  <p className="ihern-events-note">New events will be announced here, and emailed to IHERN members.</p>
                )}
              </section>
              {events.past.length ? (
                <section className="ihern-events-section" aria-labelledby="past-events">
                  <h2 className="ihern-events-heading" id="past-events">Past events</h2>
                  {events.past.map((ev) => (
                    <EventCard key={ev.id} ev={ev} />
                  ))}
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
