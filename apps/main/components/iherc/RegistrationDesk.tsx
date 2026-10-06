"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { confirmByEmailAndPhoneAction, confirmByNumberAction, confirmSignedInAction, type ConfirmResult } from "@/app/(iherc2026)/iherc2026/registration/actions";
import type { CheckMethod, ConfirmedMember } from "@/lib/iherc";
import { PAYMENT_FORM, payableFor, rupees, type FeeCategory } from "@/lib/iherc-fees";
import { u } from "@/lib/paths";

/**
 * "Register and pay" on the IHERC 2026 registration page.
 *
 * The fee is paid on the finance department's form, which this site cannot
 * fill in or change. So before sending anyone there, this asks which rate
 * applies to them; a member is confirmed against the member list (signed in,
 * membership number, or email + mobile). Then it lists, in the payment form's
 * own order, what to enter in each field (with a copy button) and the exact
 * amount, and opens the form.
 */

type Choice = FeeCategory | null;
type Field = { label: string; value: string; hint?: string };

const HERE = "/iherc2026/registration?as=member";
const SIGN_IN = u(`/login?return=${encodeURIComponent(HERE)}`);
const JOIN = u(`/join?return=${encodeURIComponent(HERE)}`);

const CHOICES: { key: FeeCategory; title: string; text: string }[] = [
  { key: "member", title: "I am an IHERN member", text: "50% off: IHERN pays half your fee." },
  { key: "student", title: "I am a student", text: "50% off: IHERN pays half your fee." },
  { key: "standard", title: "Neither", text: "Faculty, researchers and others who are not IHERN members." },
];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Older browsers: copy through a hidden text box.
      const t = document.createElement("textarea");
      t.value = value;
      t.setAttribute("readonly", "");
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      try { document.execCommand("copy"); } catch { /* the value is on screen to copy by hand */ }
      t.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button type="button" className="iherc-copy" onClick={copy} aria-label={`Copy ${label}`}>
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

/** What to enter in the payment form, field by field, then the amount and the button. */
function FillCard({ title, fields, amount, note }: { title: string; fields: Field[]; amount: number; note?: React.ReactNode }) {
  return (
    <div className="iherc-fill">
      <h3 className="iherc-fill-title">{title}</h3>
      <p className="iherc-reg-muted">Open the payment form and enter these. The fields are listed in the form&apos;s order.</p>
      <dl className="iherc-fill-list">
        {fields.map((f) => (
          <div className="iherc-fill-row" key={f.label}>
            <dt>{f.label}</dt>
            <dd>
              {f.value ? (
                <>
                  <span className="iherc-fill-value">{f.value}</span>
                  <CopyButton value={f.value} label={f.label} />
                </>
              ) : null}
              {f.hint ? <span className="iherc-fill-hint">{f.hint}</span> : null}
            </dd>
          </div>
        ))}
        <div className="iherc-fill-row iherc-fill-amount">
          <dt>Amount (Including 18% GST)</dt>
          <dd>
            <span className="iherc-fill-value">{amount}</span>
            <CopyButton value={String(amount)} label="the amount" />
            <span className="iherc-fill-hint">{rupees(amount)}</span>
          </dd>
        </div>
      </dl>
      {note ? <div className="iherc-fill-note">{note}</div> : null}
      <a className="btn btn-common" href={PAYMENT_FORM} target="_blank" rel="noopener">
        Open the payment form
      </a>
    </div>
  );
}

const METHOD_TEXT: Record<CheckMethod, string> = {
  account: "your IHERN account",
  number: "your membership number",
  "email-phone": "your email address and mobile number",
};

function MemberCard({ member, method, onReset }: { member: ConfirmedMember; method: CheckMethod; onReset: () => void }) {
  const fields: Field[] = member.full
    ? [
        { label: "Name", value: member.name },
        { label: "Email ID", value: member.email },
        { label: "Contact Number (With Country Code)", value: member.phone, hint: member.phone && !member.phone.trim().startsWith("+") ? "Add your country code, e.g. +91." : undefined },
        { label: "Category", value: "", hint: "Choose the IHERN member option." },
        { label: "Title / Designation", value: member.designation, hint: member.designation ? undefined : "Your title or position." },
        { label: "Affiliation", value: member.affiliation, hint: member.affiliation ? undefined : "Your organisation or university." },
        { label: "Are You An IHERN Member", value: "", hint: "Choose Yes." },
        { label: "Please Mention The Membership Number", value: member.number },
      ]
    : [
        { label: "Name", value: member.name },
        { label: "Email ID", value: "", hint: "The email address you joined IHERN with." },
        { label: "Contact Number (With Country Code)", value: "", hint: "Your mobile number, e.g. +91 98765 43210." },
        { label: "Category", value: "", hint: "Choose the IHERN member option." },
        { label: "Title / Designation", value: "", hint: "Your title or position." },
        { label: "Affiliation", value: "", hint: "Your organisation or university." },
        { label: "Are You An IHERN Member", value: "", hint: "Choose Yes." },
        { label: "Please Mention The Membership Number", value: member.number },
      ];
  return (
    <>
      <p className="iherc-desk-ok" role="status">
        <strong>✓ IHERN member confirmed</strong>
        <span>
          {member.name} · {member.number} (by {METHOD_TEXT[method]}). <button type="button" className="iherc-linkbtn" onClick={onReset}>Not you?</button>
        </span>
      </p>
      <FillCard
        title="Your details for the payment form"
        fields={fields}
        amount={payableFor("member")}
        note={!member.full ? <p>For your privacy, a membership number alone does not show your contact details. Sign in, or confirm with your email and mobile number, to have them filled in here.</p> : null}
      />
    </>
  );
}

/** Confirming a member who is not signed in (or whose account is not a membership). */
function MemberCheck({ onConfirmed, intro }: { onConfirmed: (r: Extract<ConfirmResult, { ok: true }>) => void; intro: string }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ConfirmResult>) =>
    start(async () => {
      setError("");
      const r = await fn();
      if (r.ok) onConfirmed(r);
      else setError(r.error);
    });
  return (
    <div className="iherc-check">
      {intro ? <p className="iherc-desk-warn" role="status">{intro}</p> : null}
      <p className="iherc-check-lead">Confirm your IHERN membership in one of these ways:</p>
      <div className="iherc-check-ways">
        <div className="iherc-check-way">
          <h3>Sign in</h3>
          <p className="iherc-reg-muted">With your IHERN account. Your details are then filled in for you.</p>
          <a className="btn btn-common" href={SIGN_IN}>Sign in</a>
        </div>
        <form
          className="iherc-check-way"
          onSubmit={(e) => {
            e.preventDefault();
            const v = String(new FormData(e.currentTarget).get("number") ?? "");
            run(() => confirmByNumberAction(v));
          }}
        >
          <h3>Membership number</h3>
          <label className="iherc-input">
            <span>Membership number</span>
            <input name="number" required placeholder="IHERN/2026-1007" autoComplete="off" maxLength={40} />
          </label>
          <button className="btn btn-common" type="submit" disabled={pending}>Confirm</button>
        </form>
        <form
          className="iherc-check-way"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            run(() => confirmByEmailAndPhoneAction(String(f.get("email") ?? ""), String(f.get("phone") ?? "")));
          }}
        >
          <h3>Email and mobile</h3>
          <label className="iherc-input">
            <span>Email you joined with</span>
            <input name="email" type="email" required autoComplete="email" maxLength={190} />
          </label>
          <label className="iherc-input">
            <span>Mobile number</span>
            <input name="phone" type="tel" required autoComplete="tel" maxLength={40} />
          </label>
          <button className="btn btn-common" type="submit" disabled={pending}>Confirm</button>
        </form>
      </div>
      <div aria-live="polite">{pending ? <p className="iherc-reg-muted">Checking…</p> : error ? <p className="iherc-desk-error" role="alert">{error}</p> : null}</div>
      <p className="iherc-reg-muted">
        Not a member yet? <a href={JOIN}>Join IHERN</a>: it is free, and you come straight back here to pay the member rate.
      </p>
    </div>
  );
}

export default function RegistrationDesk() {
  const [choice, setChoice] = useState<Choice>(null);
  const [confirmed, setConfirmed] = useState<Extract<ConfirmResult, { ok: true }> | null>(null);
  const [intro, setIntro] = useState("");
  const [checking, start] = useTransition();
  const panel = useRef<HTMLDivElement>(null);

  const chooseMember = useCallback(() => {
    setChoice("member");
    setIntro("");
    // Signed in as a member: confirmed straight away.
    start(async () => {
      const r = await confirmSignedInAction();
      if (r.ok) setConfirmed(r);
      else setIntro(r.error);
    });
  }, []);

  // Back from signing in or joining (?as=member): carry on as a member.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("as") === "member") {
      chooseMember();
      document.getElementById("register")?.scrollIntoView({ block: "start" });
    }
  }, [chooseMember]);

  const pick = (c: FeeCategory) => {
    if (c === "member") chooseMember();
    else setChoice(c);
    requestAnimationFrame(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  return (
    <div className="iherc-desk">
      <div className="iherc-desk-head">
        <h2 className="iherc-reg-title">Register and pay</h2>
        <p className="iherc-reg-muted">
          The fee is paid on the conference payment form, which opens in a new tab. Choose what applies to you first: you then see exactly what to enter and the amount to pay.
        </p>
      </div>
      <div className="iherc-desk-choices" role="group" aria-label="Which applies to you?">
        {CHOICES.map((c) => (
          <button key={c.key} type="button" className="iherc-choice" aria-pressed={choice === c.key} onClick={() => pick(c.key)}>
            <span className="iherc-choice-title">{c.title}</span>
            <span className="iherc-choice-text">{c.text}</span>
            <span className="iherc-choice-amount">{rupees(payableFor(c.key))}<small> incl. GST</small></span>
          </button>
        ))}
      </div>
      <div ref={panel} className="iherc-desk-panel" aria-live="polite">
        {choice === "member" ? (
          confirmed ? (
            <MemberCard member={confirmed.member} method={confirmed.method} onReset={() => { setConfirmed(null); setIntro(""); }} />
          ) : checking ? (
            <p className="iherc-reg-muted">Checking your IHERN account…</p>
          ) : (
            <MemberCheck intro={intro} onConfirmed={setConfirmed} />
          )
        ) : choice === "student" ? (
          <FillCard
            title="What to enter in the payment form"
            fields={[
              { label: "Name, Email ID, Contact Number", value: "", hint: "Your own details." },
              { label: "Category", value: "", hint: "Choose the student option." },
              { label: "Affiliation", value: "", hint: "Your university or college." },
              { label: "Are You An IHERN Member", value: "", hint: "Yes or No, as applies." },
              { label: "Please Mention The Membership Number", value: "", hint: "Your membership number, or NA if you are not a member." },
            ]}
            amount={payableFor("student")}
            note={<p>Please bring your student ID card to the conference: it is checked at registration.</p>}
          />
        ) : choice === "standard" ? (
          <FillCard
            title="What to enter in the payment form"
            fields={[
              { label: "Name, Email ID, Contact Number", value: "", hint: "Your own details." },
              { label: "Are You An IHERN Member", value: "No" },
              { label: "Please Mention The Membership Number", value: "NA" },
            ]}
            amount={payableFor("standard")}
            note={
              <p>
                <strong>Save {rupees(payableFor("standard") - payableFor("member"))}:</strong> IHERN membership is free. <a href={JOIN}>Join IHERN</a> first and you pay{" "}
                {rupees(payableFor("member"))} as a member.
              </p>
            }
          />
        ) : null}
      </div>
    </div>
  );
}
