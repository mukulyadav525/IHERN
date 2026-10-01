import type { ActionResult } from "@/app/(admin)/membership/admin/actions";

/** The outcome of a form action, as a banner. */
export default function Result({ state }: { state: ActionResult | null | undefined }) {
  if (!state) return null;
  return (
    <>
      {state.message ? <p className="adm-flash adm-flash--ok" role="status">{state.message}</p> : null}
      {state.error ? <p className="adm-flash adm-flash--error" role="alert">{state.error}</p> : null}
    </>
  );
}
