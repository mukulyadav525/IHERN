import { cache } from "react";
import { getEditor, type Editor } from "@ihern/core/blog";
import { readReader, type Reader } from "./session";

/**
 * Who may use the admin area: a signed-in IHERN account whose email is in
 * blog_editors. Checked by the admin layout for every page, and again by
 * every admin action (an action can be called without loading a page).
 */

export type AdminUser = Reader & { role: Editor["role"] };

export const currentEditor = cache(async (): Promise<AdminUser | null | "not-editor" | "unavailable"> => {
  const reader = await readReader();
  if (!reader) return null;
  const editor = await getEditor(reader.email);
  if (editor === null) return "unavailable";
  if (!editor) return "not-editor";
  return { ...reader, role: editor.role };
});

export class NotAllowed extends Error {}

/** For server actions: the editor, or throws. */
export async function requireEditor(role: "editor" | "admin" = "editor"): Promise<AdminUser> {
  const who = await currentEditor();
  if (!who || typeof who === "string") throw new NotAllowed("Please sign in with an editor account.");
  if (role === "admin" && who.role !== "admin") throw new NotAllowed("Only blog admins can do that.");
  return who;
}
