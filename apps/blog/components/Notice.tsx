"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * A one-line message after a sign-in or subscription round trip
 * (?notice=subscribed etc.), shown once and then removed from the address.
 */
const MESSAGES: Record<string, { text: string; kind: "ok" | "error" }> = {
  subscribed: { text: "You are subscribed to the IHERN Blog. New posts will reach you by email.", kind: "ok" },
  unsubscribed: { text: "You have been unsubscribed from the IHERN Blog.", kind: "ok" },
  "subscribe-failed": { text: "Your subscription could not be saved just now. Please try again.", kind: "error" },
  "signin-failed": { text: "Signing in did not complete. Please try again.", kind: "error" },
  "signin-off": { text: "Signing in is not available on this copy of the blog yet.", kind: "error" },
};

export default function Notice() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const key = params?.get("notice") ?? "";
  const [shown, setShown] = useState(key);

  useEffect(() => {
    if (!key) return;
    setShown(key);
    const rest = new URLSearchParams(params?.toString());
    rest.delete("notice");
    router.replace(pathname + (rest.toString() ? `?${rest}` : ""), { scroll: false });
  }, [key, params, pathname, router]);

  const msg = MESSAGES[shown];
  if (!msg) return null;
  return (
    <div className={`b-notice b-notice--${msg.kind}`} role="status">
      <div className="b-notice-inner">
        <span>{msg.text}</span>
        <button type="button" aria-label="Dismiss" onClick={() => setShown("")}>×</button>
      </div>
    </div>
  );
}
