import { cache } from "react";
import { readSession } from "./auth";
import { adminFromAccount } from "./admin";
import { getIhercEditor } from "./iherc";

/**
 * Who may use the IHERC admin (/iherc2026/admin): registrations and payments.
 * A signed-in IHERN account that is either
 *   - on its list (cdnm.iherc_editors), as an editor or an admin, or
 *   - linked to an active membership admin (lib/admin.ts), always as an admin.
 * Editors import payments, check them and ask for balances; admins can also
 * manage the list. Checked by the layout for every page, and again by every
 * action. The same rules as the events admin (lib/events-admin.ts).
 */

export type IhercUser = { id: number; name: string; email: string; role: "admin" | "editor"; membershipAdmin: boolean };

export const currentIhercUser = cache(async (): Promise<IhercUser | null | "no-access" | "unavailable"> => {
  const session = await readSession();
  if (!session) return null;
  const [editor, admin] = await Promise.all([getIhercEditor(session.email), adminFromAccount()]);
  const membershipAdmin = Boolean(admin && admin !== "unavailable");
  if (!editor && !membershipAdmin) return editor === "error" || admin === "unavailable" ? "unavailable" : "no-access";
  const role = membershipAdmin || (editor && editor !== "error" && editor.role === "admin") ? "admin" : "editor";
  return { id: session.id, name: session.name, email: session.email, role, membershipAdmin };
});

export class NotAllowed extends Error {}

/** For server actions and routes: the user, or throws. */
export async function requireIhercUser(role: "editor" | "admin" = "editor"): Promise<IhercUser> {
  const who = await currentIhercUser();
  if (!who || typeof who === "string") throw new NotAllowed("Please sign in with an account that can use the IHERC admin.");
  if (role === "admin" && who.role !== "admin") throw new NotAllowed("Only IHERC admins can do that.");
  return who;
}
