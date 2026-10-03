"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { submitMembership } from "./actions";
import { EMPTY_FIELDS, type JoinState } from "./fields";
import { POSITIONS, TITLES } from "@/lib/membership-options";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-ihern" name="btn-signup" value="1" disabled={pending}>
      {pending ? "Submitting…" : "Submit application"}
    </button>
  );
}

/** The membership form and its thank-you page (applications/register.php). */
export default function JoinForm({ returnTo = "" }: { returnTo?: string }) {
  const [state, action] = useActionState(submitMembership, { seq: 0, errors: [], old: EMPTY_FIELDS, done: null } as JoinState);
  const old = state.old;
  const [position, setPosition] = useState(old.yourTitle);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const errorsRef = useRef<HTMLDivElement>(null);
  const otherRef = useRef<HTMLInputElement>(null);

  // Each submission re-renders the form with what was typed (passwords and
  // the photograph excepted), and moves focus to the list of problems.
  useEffect(() => {
    setPosition(state.old.yourTitle);
    setPw("");
    setConfirm("");
    if (state.errors.length) errorsRef.current?.focus();
    if (state.done) window.scrollTo({ top: 0 });
  }, [state]);

  if (state.done) {
    const d = state.done;
    return (
      <section className="ihern-form-card ihern-form-done" aria-labelledby="done-title">
        <h2 id="done-title">Thank you for joining IHERN</h2>
        <p>Your membership registration has been received, {d.name}.</p>
        <dl className="ihern-form-facts">
          <dt>Membership number</dt>
          <dd>{d.number}</dd>
          <dt>Email</dt>
          <dd>{d.email}</dd>
        </dl>
        {d.mailed ? (
          <p>A confirmation has been sent to your email address.</p>
        ) : (
          <p className="ihern-form-warn" role="status">
            We could not send the confirmation email just now. Please keep a note of your membership number; the IHERN team can be reached at{" "}
            <a href="mailto:ihern@iiitd.ac.in">ihern@iiitd.ac.in</a>.
          </p>
        )}
        <p>
          You can use the same email and password to <Link href={returnTo ? `/login?mode=login&return=${encodeURIComponent(returnTo)}` : "/login"}>sign in to your IHERN account</Link>.
        </p>
        <p className="ihern-form-actions">
          <Link className="btn-ihern" href="/">
            Back to the IHERN home page
          </Link>
        </p>
      </section>
    );
  }

  const match = confirm ? (pw === confirm ? { text: "Passwords match.", cls: "ihern-hint is-ok" } : { text: "Passwords do not match yet.", cls: "ihern-hint is-bad" }) : { text: "", cls: "ihern-hint" };

  return (
    <>
      <div className="ihern-form-intro">
        <p>
          Membership of IHERN is open to researchers in the field of higher education in India, including international scholars working on
          higher education in India. As of now, the membership fee is waived.
        </p>
        <p className="ihern-form-note">
          Your name, affiliation and areas of interest may be listed on the IHERN <Link href="/members">Members</Link> page. Other details
          are not shared.
        </p>
      </div>

      <form
        key={state.seq}
        className="ihern-form-card"
        action={action}
        noValidate
        aria-describedby={state.errors.length ? "form-errors" : "form-required"}
      >
        {state.errors.length ? (
          <div className="ihern-form-errors" id="form-errors" role="alert" tabIndex={-1} ref={errorsRef}>
            <p>
              <strong>Please correct the following:</strong>
            </p>
            <ul>
              {state.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="ihern-form-required" id="form-required">
          All fields are required unless marked optional.
        </p>

        <fieldset>
          <legend>About you</legend>
          <div className="ihern-form-grid">
            <div className="ihern-field ihern-field--narrow">
              <label htmlFor="f-title">Title</label>
              <select id="f-title" name="title" required defaultValue={old.title}>
                <option value="">Select</option>
                {TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="ihern-field ihern-field--wide">
              <label htmlFor="f-name">Full name</label>
              <input type="text" id="f-name" name="studentName" maxLength={50} required autoComplete="name" defaultValue={old.studentName} />
            </div>
            <div className="ihern-field">
              <label htmlFor="f-email">Email</label>
              <input type="email" id="f-email" name="studentEmail" maxLength={50} required autoComplete="email" defaultValue={old.studentEmail} />
            </div>
            <div className="ihern-field">
              <label htmlFor="f-mobile">Mobile number</label>
              <input type="tel" id="f-mobile" name="studentMobile" maxLength={20} required autoComplete="tel" inputMode="tel" defaultValue={old.studentMobile} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Your work</legend>
          <div className="ihern-form-grid">
            <div className="ihern-field">
              <label htmlFor="f-org">
                Organization <span className="ihern-optional">(optional)</span>
              </label>
              <input type="text" id="f-org" name="institutionName" maxLength={200} autoComplete="organization" defaultValue={old.institutionName} />
              <small className="ihern-hint">The organization you work for.</small>
            </div>
            <div className="ihern-field">
              <label htmlFor="f-dept">Department</label>
              <input type="text" id="f-dept" name="areasofinterest" maxLength={50} required defaultValue={old.areasofinterest} />
            </div>
            <div className="ihern-field">
              <label htmlFor="f-position">Position</label>
              <select
                id="f-position"
                name="yourTitle"
                required
                defaultValue={old.yourTitle}
                onChange={(e) => {
                  setPosition(e.target.value);
                  // Into the new field - unless the reader has already moved on.
                  const select = e.target;
                  if (select.value === "Any other") setTimeout(() => { if (document.activeElement === select) otherRef.current?.focus(); }, 0);
                }}
              >
                <option value="">Select</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="ihern-field" id="f-other-wrap" hidden={position !== "Any other"}>
              <label htmlFor="f-other">Your position</label>
              <input type="text" id="f-other" name="anyothervalue" maxLength={100} defaultValue={old.anyothervalue} ref={otherRef} />
            </div>
            <div className="ihern-field ihern-field--full">
              <label htmlFor="f-interest">Areas of research interest in higher education</label>
              <input type="text" id="f-interest" name="areasofinteresthe" maxLength={1000} required defaultValue={old.areasofinteresthe} />
              <small className="ihern-hint">List up to three, separated by commas.</small>
            </div>
            <div className="ihern-field ihern-field--full">
              <label htmlFor="f-url">
                Homepage link <span className="ihern-optional">(optional)</span>
              </label>
              <input type="url" id="f-url" name="url" maxLength={100} inputMode="url" placeholder="https://" defaultValue={old.url} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Account and photograph</legend>
          <div className="ihern-form-grid">
            <div className="ihern-field">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" minLength={8} required autoComplete="new-password" onChange={(e) => setPw(e.target.value)} />
              <small className="ihern-hint">At least 8 characters. You can use it to sign in to your IHERN account.</small>
            </div>
            <div className="ihern-field">
              <label htmlFor="confirm_password">Confirm password</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                minLength={8}
                required
                autoComplete="new-password"
                onChange={(e) => setConfirm(e.target.value)}
              />
              <small className={match.cls} id="pw-match" aria-live="polite">
                {match.text}
              </small>
            </div>
            <div className="ihern-field ihern-field--full">
              <label htmlFor="photo">
                Recent photograph <span className="ihern-optional">(optional)</span>
              </label>
              <input type="file" id="photo" name="photo" accept="image/jpeg,image/png" />
              <small className="ihern-hint">JPEG or PNG, up to 5 MB. It may be shown on the IHERN members page.</small>
            </div>
          </div>
        </fieldset>

        <div className="ihern-form-submit">
          <Submit />
          <p>
            Already registered? <Link href="/membership/login">Member sign in</Link>
          </p>
        </div>
      </form>
    </>
  );
}
