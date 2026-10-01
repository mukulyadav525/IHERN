import { cache } from "react";
import { initials } from "@ihern/core/text";
import { readReaderState, type Reader } from "./session";
import { mainUrl } from "./site";

/** The signed-in reader and their status, looked up once per request (one query). */
export const currentReaderState = cache(readReaderState);

/** The signed-in reader for this request. */
export const currentReader = cache(async (): Promise<Reader | null> => (await currentReaderState())?.reader ?? null);

/** Is the signed-in reader subscribed to the blog? */
export const currentSubscribed = cache(async (): Promise<boolean> => (await currentReaderState())?.subscribed ?? false);

/** What the header's account control shows. */
export const headerAccount = cache(async () => {
  const state = await currentReaderState();
  if (!state) return null;
  const { reader } = state;
  return {
    initials: initials(reader.name, reader.email),
    name: reader.name,
    email: reader.email,
    subscribed: state.subscribed,
    isEditor: state.editor,
    accountUrl: mainUrl("account"),
  };
});
