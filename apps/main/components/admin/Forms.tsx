"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/app/(admin)/membership/admin/actions";
import Result from "./Result";

/**
 * A small admin form around one server action: shows the outcome, clears
 * itself after adding something new, and refreshes the page's data.
 */
export function ActionForm({
  action,
  children,
  className = "adm-form",
  reset = false,
}: {
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  reset?: boolean;
}) {
  const [state, run] = useActionState(action, { ok: false, message: "", error: "" } as ActionResult);
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const allowReset = useKeepValues(ref);
  useEffect(() => {
    if (state.ok) {
      if (reset) {
        allowReset.current = true;
        ref.current?.reset();
      }
      router.refresh();
    }
  }, [state, reset, router, allowReset]);
  return (
    // Keeps what was typed (a refused edit is not lost); clears only after
    // adding something new (`reset`).
    <form ref={ref} action={run} className={className}>
      <Result state={state} />
      {children}
    </form>
  );
}

/**
 * Keeps what was typed in a form after it is submitted. React 19 clears a
 * form after every submission; that would throw away an edit the server
 * refused. Returns a ref: set it to true just before a reset you do want.
 *
 * A native listener, not onReset: React runs that automatic reset while it
 * is committing, when its own event handlers are switched off.
 */
export function useKeepValues(form: React.RefObject<HTMLFormElement | null>) {
  const allow = useRef(false);
  useEffect(() => {
    const el = form.current;
    if (!el) return;
    const keep = (e: Event) => {
      if (allow.current) allow.current = false;
      else e.preventDefault();
    };
    el.addEventListener("reset", keep);
    return () => el.removeEventListener("reset", keep);
  }, [form]);
  return allow;
}

export function Submit({ label, pendingLabel = "Saving…", className = "adm-btn" }: { label: string; pendingLabel?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}
