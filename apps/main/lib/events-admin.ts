import { cache } from "react";
import { readSession } from "./auth";
import { adminFromAccount } from "./admin";
import { getEventEditor } from "./events";

/**
 * Who may use the events admin (/events/admin): a signed-in IHERN account
 * that is either
 *   - on its list (cdnm.event_editors), as an editor or an admin, or
 *   - linked to an active membership admin (see lib/admin.ts), always as an
 *     admin: the membership admins look after IHERN's members, and the
 *     events admin emails them.
 * Admins can also manage the list. Checked by the layout for every page, and
 * again by every action (an action can be called without loading a page).
 */

export type EventsUser = { id: number; name: string; email: string; role: "admin" | "editor"; membershipAdmin: boolean };

export const currentEventsUser = cache(async (): Promise<EventsUser | null | "no-access" | "unavailable"> => {
  const session = await readSession();
  if (!session) return null;
  const [editor, admin] = await Promise.all([getEventEditor(session.email), adminFromAccount()]);
  const membershipAdmin = Boolean(admin && admin !== "unavailable");
  if (!editor && !membershipAdmin) return editor === "error" || admin === "unavailable" ? "unavailable" : "no-access";
  const role = membershipAdmin || (editor && editor !== "error" && editor.role === "admin") ? "admin" : "editor";
  return { id: session.id, name: session.name, email: session.email, role, membershipAdmin };
});

export class NotAllowed extends Error {}

/** For server actions: the user, or throws. */
export async function requireEventsUser(role: "editor" | "admin" = "editor"): Promise<EventsUser> {
  const who = await currentEventsUser();
  if (!who || typeof who === "string") throw new NotAllowed("Please sign in with an account that can use the events admin.");
  if (role === "admin" && who.role !== "admin") throw new NotAllowed("Only events admins can do that.");
  return who;
}
