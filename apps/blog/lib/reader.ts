import { cache } from "react";
import { initials } from "@ihern/core/text";
import { isMembershipAdmin } from "@ihern/core/roles";
import type { AccountMenuData } from "@ihern/core/ui/AccountMenu";
import { u } from "./paths";
import { readReaderState, type Reader } from "./session";
import { mainUrl } from "./site";

/** The signed-in reader and their status, looked up once per request (one query). */
export const currentReaderState = cache(readReaderState);

/** The signed-in reader for this request. */
export const currentReader = cache(async (): Promise<Reader | null> => (await currentReaderState())?.reader ?? null);

/** Is the signed-in reader subscribed to the blog? */
export const currentSubscribed = cache(async (): Promise<boolean> => (await currentReaderState())?.subscribed ?? false);

/**
 * The account menu in the header: My account and the IHERN website on the
 * main site, the subscription, and the admin areas this reader can open (the
 * membership admin only when the blog can read ihern2024; see .env.example).
 */
export const headerAccount = cache(async (): Promise<AccountMenuData | null> => {
  const state = await currentReaderState();
  if (!state) return null;
  const { reader } = state;
  const admin = [];
  if (state.editor) admin.push({ label: "Blog admin", href: u("/admin") });
  if (await isMembershipAdmin(reader.email)) admin.push({ label: "Membership admin", href: mainUrl("membership/admin") });
  return {
    initials: initials(reader.name, reader.email),
    name: reader.name,
    email: reader.email,
    links: [
      { label: "My account", href: mainUrl("account") },
      ...(state.subscribed ? [] : [{ label: "Subscribe to the blog", href: u("/subscribe") }]),
      { label: "IHERN website", href: mainUrl("") },
    ],
    status: state.subscribed ? "Subscribed to the blog ✓" : undefined,
    admin,
    signOut: u("/api/sso/logout"),
  };
});
