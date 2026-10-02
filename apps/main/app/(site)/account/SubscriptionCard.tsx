"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changeSubscription, type SubscriptionState } from "./actions";
import { u } from "@/lib/paths";

function Submit({ subscribed }: { subscribed: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={subscribed ? "auth-secondary" : "auth-submit"} disabled={pending}>
      {subscribed ? "Unsubscribe from the IHERN Blog" : "Subscribe to the IHERN Blog"}
    </button>
  );
}

/** The account facts and the subscription button (blog-account.php). */
export default function SubscriptionCard({
  name,
  email,
  initial,
  returnTo,
}: {
  name: string;
  email: string;
  initial: SubscriptionState;
  returnTo: string;
}) {
  const [state, action] = useActionState(changeSubscription, initial);

  return (
    <div className="auth-card">
      <h1 className="auth-title">My account</h1>
      <p className="auth-sub">One IHERN account, across the website and the blog.</p>

      {state.error ? (
        <div className="auth-alert" role="alert">
          {state.error}
        </div>
      ) : null}
      {state.notice ? (
        <div className="auth-note" role="status">
          {state.notice}
        </div>
      ) : null}

      <dl className="account-facts">
        <dt>Name</dt>
        <dd>{name}</dd>
        <dt>Email</dt>
        <dd>{email}</dd>
        <dt>Blog subscription</dt>
        <dd>{state.subscribed ? "Subscribed ✓" : "Not subscribed"}</dd>
      </dl>

      <form action={action}>
        <input type="hidden" name="action" value={state.subscribed ? "unsubscribe" : "subscribe"} />
        <Submit subscribed={state.subscribed} />
      </form>

      <p className="auth-back">
        <a href={u(returnTo)}>&larr; Back to Blogs</a>
        &nbsp;&middot;&nbsp;
        <a href={u("/logout")}>Sign out</a>
      </p>
    </div>
  );
}
