"use client";

import { useActionState, useEffect, useRef } from "react";
import { Submit } from "@/components/admin/Forms";
import { signInAdmin, type LoginState } from "../actions";

export default function AdminLoginForm() {
  const [state, run] = useActionState(signInAdmin, { error: "", email: "" } as LoginState);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state]);
  return (
    <form action={run} className="adm-form">
      {state.error ? (
        <p className="adm-flash adm-flash--error" role="alert" tabIndex={-1} ref={errorRef}>
          {state.error}
        </p>
      ) : null}
      <label className="adm-field">
        <span>Email</span>
        <input type="email" name="email" required autoComplete="username" defaultValue={state.email} autoFocus />
      </label>
      <label className="adm-field">
        <span>Password</span>
        <input type="password" name="password" required autoComplete="current-password" />
      </label>
      <Submit label="Sign in" pendingLabel="Signing in…" />
    </form>
  );
}
