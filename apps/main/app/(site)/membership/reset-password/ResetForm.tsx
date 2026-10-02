"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { chooseNewPassword, type ResetState } from "../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="auth-submit" name="btn-reset-pass" value="1" disabled={pending}>
      Save new password
    </button>
  );
}

/** Choose a new password (applications/resetpass.php). */
export default function ResetForm({ id, code, initial }: { id: string; code: string; initial: ResetState }) {
  const [state, action] = useActionState(chooseNewPassword, initial);

  return (
    <div className="auth-card">
      <h1 className="auth-title">Choose a new password</h1>

      {state.state === "invalid" ? (
        <>
          <div className="auth-alert" role="alert">
            This reset link is not valid or has already been used.
          </div>
          <p className="auth-back">
            <Link href="/membership/forgot-password">Request a new link</Link>
          </p>
        </>
      ) : state.state === "done" ? (
        <>
          <div className="auth-note" role="status">
            Your password has been changed.
          </div>
          <p className="auth-back">
            <Link href="/membership/login">Sign in with your new password</Link>
          </p>
        </>
      ) : (
        <>
          <p className="auth-sub">For your IHERN membership.</p>
          {state.error ? (
            <div className="auth-alert" role="alert">
              {state.error}
            </div>
          ) : null}
          <form action={action}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="code" value={code} />
            <div className="auth-field">
              <label htmlFor="pass">New password</label>
              <input type="password" id="pass" name="pass" required minLength={8} autoComplete="new-password" />
              <small className="auth-hint">At least 8 characters.</small>
            </div>
            <div className="auth-field">
              <label htmlFor="confirm-pass">Confirm new password</label>
              <input type="password" id="confirm-pass" name="confirm-pass" required minLength={8} autoComplete="new-password" />
            </div>
            <Submit />
          </form>
        </>
      )}
    </div>
  );
}
