"use client";

import { useEffect } from "react";
import { u } from "@/lib/paths";

/**
 * After a successful sign-in: a full navigation to where the reader was going,
 * so the header and any single sign-on hand-off see the new session. Without
 * JavaScript the meta refresh and the link do the same.
 */
export default function Continue({ to, label = "Continue" }: { to: string; label?: string }) {
  const href = u(to);
  useEffect(() => {
    window.location.assign(href);
  }, [href]);
  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${href}`} />
      <div className="auth-note" role="status">
        Signed in. <a href={href}>{label} &rarr;</a>
      </div>
    </>
  );
}
