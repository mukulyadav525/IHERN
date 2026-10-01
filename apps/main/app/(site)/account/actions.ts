"use server";

import { readSession } from "@/lib/auth";
import { isSubscribed, setSubscribed } from "@ihern/core/store";

/** Subscribe / unsubscribe from the account page (blog-account.php's POST branch). */

export type SubscriptionState = { subscribed: boolean; notice: string; error: string };

export async function changeSubscription(prev: SubscriptionState, form: FormData): Promise<SubscriptionState> {
  const session = await readSession();
  if (!session) return { ...prev, notice: "", error: "Your session expired. Please sign in again." };

  const action = String(form.get("action") ?? "");
  if (action !== "subscribe" && action !== "unsubscribe") return { ...prev, notice: "", error: "Unknown action." };

  const res = await setSubscribed(session.id, action === "subscribe", "account");
  if (!res.ok) return { ...prev, notice: "", error: "Could not update your subscription. Please try again." };

  const now = await isSubscribed(session.id);
  return {
    subscribed: now === null ? res.value.subscribed : now,
    error: "",
    notice: action === "subscribe" ? "You are subscribed to the IHERN Blog." : "You have been unsubscribed from the IHERN Blog.",
  };
}
