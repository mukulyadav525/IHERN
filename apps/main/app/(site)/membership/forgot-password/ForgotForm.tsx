"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { requestReset, type ForgotState } from "../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="auth-submit" name="btn-submit" value="1" disabled={pending}>
      Send reset link
    </button>
  );
}

/** Reset your password (applications/forgotPassword.php). */
export default function ForgotForm() {
  const [state, action] = useActionState(requestReset, { status: "", email: "" } as ForgotState);

  return (
    <div className="auth-card">
      <h1 className="auth-title">Reset your password</h1>
      <p className="auth-sub">
        For your IHERN membership. Enter the email address you registered with and we will send you a link to choose a new password.
      </p>

      {state.status === "sent" ? (
        <div className="auth-note" role="status">
          If {state.email} is registered with IHERN, a password reset link is on its way. Please check your inbox.
        </div>
      ) : state.status === "failed" ? (
        <div className="auth-alert" role="alert">
          We could not send the reset email just now. Please try again in a few minutes, or write to{" "}
          <a href="mailto:ihern@iiitd.ac.in">ihern@iiitd.ac.in</a>.
        </div>
      ) : state.status === "invalid" ? (
        <div className="auth-alert" role="alert">
          Please enter a valid email address.
        </div>
      ) : null}

      <form action={action}>
        <div className="auth-field">
          <label htmlFor="txtemail">Email</label>
          <input type="email" id="txtemail" name="txtemail" required autoComplete="email" defaultValue={state.email} key={state.email} />
        </div>
        <Submit />
      </form>

      <p className="auth-back">
        <Link href="/membership/login">Back to member sign in</Link>
      </p>
    </div>
  );
}
