"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toggleSubscription, type SubscribeState } from "@/app/actions/reader";
import { u } from "@/lib/paths";

/**
 * "Subscribe to the IHERN Blog": tied to the IHERN account, so a signed-in
 * reader subscribes with one click (no email address to type); a signed-out
 * reader signs in first and is subscribed on the way back.
 */

function Button({ subscribed }: { subscribed: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`b-btn${subscribed ? " b-btn--ghost" : ""}`} disabled={pending}>
      {subscribed ? "Unsubscribe" : "Subscribe"}
    </button>
  );
}

export default function SubscribeBox({
  signedIn,
  subscribed,
  returnTo,
  accountUrl,
  heading = "h2",
}: {
  signedIn: boolean;
  subscribed: boolean;
  returnTo: string;
  accountUrl: string;
  heading?: "h1" | "h2";
}) {
  const [state, action] = useActionState(toggleSubscription, { subscribed, message: "", error: "" } as SubscribeState);
  const H = heading;

  if (!signedIn) {
    const back = encodeURIComponent(returnTo);
    return (
      <aside className="b-card b-subscribe" aria-labelledby="subscribe-title">
        <H className="b-subscribe-title" id="subscribe-title">Subscribe to the IHERN Blog</H>
        <p>New posts on higher education in India, by email. Subscribing uses your IHERN account — one account for the IHERN website and the blog.</p>
        <div className="b-actions">
          <a className="b-btn" href={u(`/api/sso/login?after=subscribe&return=${back}`)}>Subscribe</a>
          <a className="b-btn b-btn--ghost" href={u(`/api/sso/login?mode=register&after=subscribe&return=${back}`)}>Create IHERN account</a>
        </div>
        <p className="b-subscribe-foot">Already have an account? Sign in and you will be subscribed straight away.</p>
      </aside>
    );
  }

  return (
    <aside className={`b-card b-subscribe${state.subscribed ? " is-subscribed" : ""}`} aria-labelledby="subscribe-title">
      <H className="b-subscribe-title" id="subscribe-title">{state.subscribed ? "Subscribed ✓" : "Subscribe to the IHERN Blog"}</H>
      <p>
        {state.subscribed
          ? "New posts reach you by email, at the address on your IHERN account."
          : "Get new posts on higher education in India by email, at the address on your IHERN account."}
      </p>
      {state.message ? <p className="b-form-ok" role="status">{state.message}</p> : null}
      {state.error ? <p className="b-form-error" role="alert">{state.error}</p> : null}
      <form action={action} className="b-actions">
        <input type="hidden" name="action" value={state.subscribed ? "unsubscribe" : "subscribe"} />
        <Button subscribed={state.subscribed} />
        <a className="b-btn b-btn--ghost" href={accountUrl}>My account</a>
      </form>
    </aside>
  );
}
