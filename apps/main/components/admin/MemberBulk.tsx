"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { bulkMembersAction, type ActionResult } from "@/app/(admin)/membership/admin/actions";
import Result from "./Result";

const BOXES = 'input[form="member-bulk"][name="ids"]';

function Buttons({ selected, active }: { selected: number; active: number }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button type="submit" className="adm-btn adm-btn--small" disabled={pending || !selected}>
        {pending ? "Working…" : "Apply"}
      </button>
      <button
        type="submit"
        name="all"
        value="1"
        className="adm-btn adm-btn--ghost adm-btn--small"
        disabled={pending}
        onClick={(e) => {
          if (!window.confirm(`Email all ${active} active members, asking them to check and update their details? Members asked in the last 7 days who have not responded are left out.`)) e.preventDefault();
        }}
      >
        Ask all active members to update their details
      </button>
    </>
  );
}

/**
 * The Members list's bulk actions. The rows' tick boxes (MemberTable,
 * `selectable`) belong to this form through their form="member-bulk".
 */
export default function MemberBulk({ active }: { active: number }) {
  const router = useRouter();
  const [state, run] = useActionState(
    (prev: ActionResult, form: FormData) => {
      if (form.get("all") === "1") form.set("op", "request-update-all");
      return bulkMembersAction(prev, form);
    },
    { ok: false, message: "", error: "" } as ActionResult
  );
  const [selected, setSelected] = useState(0);
  const allRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const count = () => {
      const boxes = Array.from(document.querySelectorAll<HTMLInputElement>(BOXES));
      const n = boxes.filter((b) => b.checked).length;
      setSelected(n);
      if (allRef.current) {
        allRef.current.checked = n > 0 && n === boxes.length;
        allRef.current.indeterminate = n > 0 && n < boxes.length;
      }
    };
    document.addEventListener("change", count);
    count();
    return () => document.removeEventListener("change", count);
  }, []);

  useEffect(() => {
    if (!state.ok) return;
    document.querySelectorAll<HTMLInputElement>(BOXES).forEach((b) => (b.checked = false));
    setSelected(0);
    if (allRef.current) allRef.current.checked = allRef.current.indeterminate = false;
    router.refresh();
  }, [state, router]);

  return (
    <form
      id="member-bulk"
      action={run}
      className="adm-bulk"
      onSubmit={(e) => {
        const op = (e.currentTarget.elements.namedItem("op") as HTMLSelectElement).value;
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.name === "all") return;
        const what = op === "request-update" ? "email them, asking them to update their details" : op === "deactivate" ? "deactivate them (they will not be able to sign in)" : "activate them";
        if (!window.confirm(`${selected} selected: ${what}?`)) e.preventDefault();
      }}
    >
      <Result state={state} />
      <div className="adm-bulk-row">
        <label className="adm-check">
          <input
            ref={allRef}
            type="checkbox"
            onChange={(e) => {
              document.querySelectorAll<HTMLInputElement>(BOXES).forEach((b) => (b.checked = e.target.checked));
              setSelected(e.target.checked ? document.querySelectorAll(BOXES).length : 0);
            }}
          />
          Select all on this page
        </label>
        <span className="adm-muted" aria-live="polite">{selected} selected</span>
        <label className="adm-sr" htmlFor="bulk-op">With the selected members</label>
        <select id="bulk-op" name="op" defaultValue="request-update">
          <option value="request-update">Ask to update their details</option>
          <option value="activate">Activate</option>
          <option value="deactivate">Deactivate</option>
        </select>
        <Buttons selected={selected} active={active} />
      </div>
    </form>
  );
}
