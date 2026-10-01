"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ActionResult } from "@/app/(admin)/admin/actions";

/**
 * A button that runs one server action (already bound to its item), asks for
 * confirmation first when `confirm` is given, shows the result, and refreshes
 * the page's data.
 */
export default function ActionButton({
  action,
  label,
  confirm,
  className = "adm-link",
  after,
}: {
  action: () => Promise<ActionResult>;
  label: string;
  confirm?: string;
  className?: string;
  after?: string; // navigate here after success
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ActionResult | null>(null);
  return (
    <span className="adm-action">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => {
            const res = await action();
            setMsg(res);
            if (res.ok) {
              if (after) router.push(after);
              router.refresh();
            }
          });
        }}
      >
        {pending ? "…" : label}
      </button>
      {msg && !msg.ok ? <span className="adm-inline-error" role="alert">{msg.error}</span> : null}
    </span>
  );
}
