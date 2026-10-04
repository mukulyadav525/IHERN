"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { updateProfileAction, type ProfileState } from "./actions";
import { POSITIONS, TITLES } from "@/lib/membership-options";

export type ProfileValues = {
  title: string;
  name: string;
  email: string;
  number: string;
  mobile: string;
  institutionName: string;
  areasofinterest: string;
  position: string;
  other: string;
  areasofinteresthe: string;
  url: string;
  hasPhoto: boolean;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-ihern" disabled={pending}>
      {pending ? "Saving…" : "Save my details"}
    </button>
  );
}

/** The membership form's fields, filled in, for a member to update (the join form's look: .ihern-form-*). */
export default function ProfileForm({ values: v, token, signedIn }: { values: ProfileValues; token: string; signedIn: boolean }) {
  const [state, action] = useActionState(updateProfileAction.bind(null, token), { seq: 0, errors: [], done: false } as ProfileState);
  const [position, setPosition] = useState(v.position);
  const errorsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.errors.length) errorsRef.current?.focus();
    if (state.done) window.scrollTo({ top: 0 });
  }, [state]);
  // Keep what was typed when the server refuses it (React 19 resets a form after every submission).
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const keep = (e: Event) => e.preventDefault();
    el.addEventListener("reset", keep);
    return () => el.removeEventListener("reset", keep);
  }, []);

  if (state.done) {
    return (
      <section className="ihern-form-card ihern-form-done" aria-labelledby="done-title">
        <h2 id="done-title">Thank you</h2>
        <p>Your IHERN membership details are updated.</p>
        <p className="ihern-form-actions">
          <Link className="btn-ihern" href={signedIn ? "/membership/dashboard" : "/"}>
            {signedIn ? "Back to my membership" : "Back to the IHERN home page"}
          </Link>
        </p>
      </section>
    );
  }

  return (
    <form ref={formRef} className="ihern-form-card" action={action} noValidate aria-describedby={state.errors.length ? "form-errors" : "form-required"}>
      {state.errors.length ? (
        <div className="ihern-form-errors" id="form-errors" role="alert" tabIndex={-1} ref={errorsRef}>
          <p><strong>Please correct the following:</strong></p>
          <ul>{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      ) : null}
      <dl className="ihern-form-facts">
        <dt>Membership number</dt>
        <dd>{v.number}</dd>
        <dt>Email</dt>
        <dd>{v.email}</dd>
      </dl>
      <p className="ihern-form-required" id="form-required">
        All fields are required unless marked optional. To change your email address, please write to <a href="mailto:ihern@iiitd.ac.in">ihern@iiitd.ac.in</a>.
      </p>

      <fieldset>
        <legend>About you</legend>
        <div className="ihern-form-grid">
          <div className="ihern-field ihern-field--narrow">
            <label htmlFor="f-title">Title</label>
            <select id="f-title" name="title" required defaultValue={v.title}>
              <option value="">Select</option>
              {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="ihern-field ihern-field--wide">
            <label htmlFor="f-name">Full name</label>
            <input type="text" id="f-name" name="studentName" maxLength={90} required autoComplete="name" defaultValue={v.name} />
          </div>
          <div className="ihern-field">
            <label htmlFor="f-mobile">Mobile number</label>
            <input type="tel" id="f-mobile" name="studentMobile" maxLength={20} required autoComplete="tel" inputMode="tel" defaultValue={v.mobile} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Your work</legend>
        <div className="ihern-form-grid">
          <div className="ihern-field">
            <label htmlFor="f-org">Organization <span className="ihern-optional">(optional)</span></label>
            <input type="text" id="f-org" name="institutionName" maxLength={200} autoComplete="organization" defaultValue={v.institutionName} />
          </div>
          <div className="ihern-field">
            <label htmlFor="f-dept">Department</label>
            <input type="text" id="f-dept" name="areasofinterest" maxLength={500} required defaultValue={v.areasofinterest} />
          </div>
          <div className="ihern-field">
            <label htmlFor="f-position">Position</label>
            <select id="f-position" name="yourTitle" required defaultValue={v.position} onChange={(e) => setPosition(e.target.value)}>
              <option value="">Select</option>
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="ihern-field" hidden={position !== "Any other"}>
            <label htmlFor="f-other">Your position</label>
            <input type="text" id="f-other" name="anyothervalue" maxLength={100} defaultValue={v.other} />
          </div>
          <div className="ihern-field ihern-field--full">
            <label htmlFor="f-interest">Areas of research interest in higher education</label>
            <input type="text" id="f-interest" name="areasofinteresthe" maxLength={1000} required defaultValue={v.areasofinteresthe} />
            <small className="ihern-hint">List up to three, separated by commas.</small>
          </div>
          <div className="ihern-field ihern-field--full">
            <label htmlFor="f-url">Homepage link <span className="ihern-optional">(optional)</span></label>
            <input type="url" id="f-url" name="url" maxLength={250} inputMode="url" placeholder="https://" defaultValue={v.url} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Photograph</legend>
        <div className="ihern-form-grid">
          <div className="ihern-field ihern-field--full">
            <label htmlFor="photo">
              {v.hasPhoto ? "Replace your photograph" : "Add a recent photograph"} <span className="ihern-optional">(optional)</span>
            </label>
            <input type="file" id="photo" name="photo" accept="image/jpeg,image/png" />
            <small className="ihern-hint">
              {v.hasPhoto ? "We have a photograph of you. Choose a new one only to replace it. " : ""}JPEG or PNG, up to 5 MB. It may be shown on the IHERN members page.
            </small>
          </div>
          {v.hasPhoto ? (
            <div className="ihern-field ihern-field--full">
              <label className="ihern-check">
                <input type="checkbox" name="removePhoto" value="1" /> Remove my photograph
              </label>
            </div>
          ) : null}
        </div>
      </fieldset>

      <div className="ihern-form-submit">
        <Submit />
      </div>
    </form>
  );
}
