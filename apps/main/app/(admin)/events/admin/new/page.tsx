import Link from "next/link";
import EventForm from "@/components/admin/EventForm";
import { activeMembers } from "@/lib/events";

export const metadata = { title: "Add an event" };
export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const members = await activeMembers();
  return (
    <>
      <header className="adm-head">
        <h1>Add an event</h1>
        <Link className="adm-link" href="/events/admin">← All events</Link>
      </header>
      <EventForm event={null} members={members?.length ?? null} />
    </>
  );
}
