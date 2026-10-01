import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SubscriptionCard from "./SubscriptionCard";
import { readSession, safeReturn } from "@/lib/auth";
import { getAccountById, isSubscribed } from "@ihern/core/store";

/**
 * My IHERN account (blog-account.php) - reached from the main site and from
 * the blog's account menu. Who is signed in, and the IHERN Blog subscription.
 * Deliberately small: this is not a profile system.
 */

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

const LOGIN = "/login?mode=login&return=%2Faccount";

export default async function AccountPage(props: { searchParams: Promise<{ return?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await readSession();
  if (!session) redirect(LOGIN);

  const returnTo = safeReturn(searchParams.return);
  const user = await getAccountById(session.id);

  if (!user.ok && user.reason === "not_found") {
    // A session for a deleted account: end it rather than show a broken page.
    redirect("/logout?return=" + encodeURIComponent(LOGIN));
  }

  let error = "";
  let subscribed = false;
  if (user.ok) {
    const s = await isSubscribed(session.id);
    if (s === null) error = "Could not read your subscription status.";
    else subscribed = s;
  } else {
    error = "The account service is temporarily unavailable. Please try again shortly.";
  }

  return (
    <div className="ihern-auth-page">
      <main className="auth-wrap" id="main">
        <SubscriptionCard
          name={user.ok ? user.value.name : session.name}
          email={user.ok ? user.value.email : session.email}
          initial={{ subscribed, notice: "", error }}
          returnTo={returnTo}
        />
      </main>
    </div>
  );
}
