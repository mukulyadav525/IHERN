"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signInMember, type MemberLoginState } from "../actions";
import { u } from "@/lib/paths";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="auth-submit" name="btn-login" value="1" disabled={pending}>
      Sign in
    </button>
  );
}

const MESSAGES: Record<string, React.ReactNode> = {
  error: "The email or password is incorrect.",
  inactive: (
    <>
      This membership has not been activated yet. For help, please email <a href="mailto:ihern@iiitd.ac.in">ihern@iiitd.ac.in</a>.
    </>
  ),
  unavailable: "The membership service is temporarily unavailable. Please try again shortly.",
  throttled: "Too many unsuccessful attempts. Please wait 15 minutes and try again, or reset your password.",
};

/** Member sign in (applications/index.php). */
export default function MemberLoginForm() {
  const [state, action] = useActionState(signInMember, { error: "", email: "" } as MemberLoginState);

  useEffect(() => {
    if (state.next) window.location.assign(u(state.next));
  }, [state.next]);

  return (
    <div className="auth-card">
      <h1 className="auth-title">Member sign in</h1>
      <p className="auth-sub">Sign in to view your IHERN membership registration.</p>

      {state.next ? <meta httpEquiv="refresh" content={`0;url=${u(state.next)}`} /> : null}
      {state.error ? (
        <div className="auth-alert" role="alert">
          {MESSAGES[state.error]}
        </div>
      ) : null}

      <form action={action}>
        <div className="auth-field">
          <label htmlFor="txtemail">Email</label>
          <input type="email" id="txtemail" name="txtemail" required autoComplete="email" defaultValue={state.email} key={state.email} />
        </div>
        <div className="auth-field">
          <label htmlFor="txtupass">Password</label>
          <input type="password" id="txtupass" name="txtupass" required autoComplete="current-password" />
        </div>
        <Submit />
      </form>

      <p className="auth-back">
        <Link href="/membership/forgot-password">Forgot your password?</Link> &nbsp;&middot;&nbsp; <Link href="/join">Join IHERN</Link>
      </p>
    </div>
  );
}
