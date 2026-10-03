"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import Continue from "@/components/Continue";
import { authenticate, type AuthState } from "./actions";
import { u } from "@/lib/paths";

function Submit({ mode }: { mode: AuthState["mode"] }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="auth-submit" disabled={pending}>
      {mode === "register" ? "Create account" : "Sign in"}
    </button>
  );
}

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

/** The sign-in / create-account card (blog-login.php). */
export default function AuthForm({
  initial,
  returnTo,
  googleOn,
  domainHint,
}: {
  initial: AuthState;
  returnTo: string;
  googleOn: boolean;
  domainHint: string;
}) {
  const [state, action] = useActionState(authenticate, initial);
  const mode = state.mode;
  const ret = encodeURIComponent(returnTo);

  return (
    <div className="auth-card">
      <h1 className="auth-title">{mode === "register" ? "Create your IHERN account" : "Sign in to IHERN"}</h1>
      <p className="auth-sub">
        One IHERN account for the website and the IHERN Blog. Members who joined through the membership form can sign in with the same
        email and password.
      </p>

      {/* Two links to two pages, not ARIA tabs. */}
      <nav className="auth-tabs" aria-label="Sign in or create an account">
        <Link
          className={`auth-tab ${mode === "login" ? "is-active" : ""}`}
          aria-current={mode === "login" ? "page" : undefined}
          href={`/login?mode=login&return=${ret}`}
        >
          Sign in
        </Link>
        <Link
          className={`auth-tab ${mode === "register" ? "is-active" : ""}`}
          aria-current={mode === "register" ? "page" : undefined}
          href={`/join?return=${ret}`}
        >
          Create account
        </Link>
      </nav>

      {state.next ? <Continue to={state.next} /> : null}

      {state.error ? (
        <div className="auth-alert" role="alert">
          {state.error}
        </div>
      ) : null}

      {googleOn ? (
        <>
          <a className="auth-google" href={u(`/api/auth/google?return=${ret}`)}>
            {GOOGLE_ICON}
            <span>Continue with Google</span>
          </a>
          <div className="auth-divider">
            <span>or use your email</span>
          </div>
        </>
      ) : null}

      <form action={action} noValidate key={mode}>
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="return" value={returnTo} />

        {mode === "register" ? (
          <div className="auth-field">
            <label htmlFor="name">Full name</label>
            <input type="text" id="name" name="name" required autoComplete="name" defaultValue={state.name} />
          </div>
        ) : null}

        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required autoComplete="email" placeholder="you@example.com" defaultValue={state.email} />
          {domainHint ? <small className="auth-hint">{domainHint}</small> : null}
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={8}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
          {mode === "register" ? <small className="auth-hint">At least 8 characters.</small> : null}
        </div>

        <Submit mode={mode} />
      </form>

      <p className="auth-back">
        Want to be listed as an IHERN member? <Link href={`/join?return=${ret}`}>Join IHERN</Link>
      </p>
    </div>
  );
}
