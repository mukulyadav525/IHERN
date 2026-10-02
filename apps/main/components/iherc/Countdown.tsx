"use client";

import { useEffect, useState } from "react";

/**
 * The conference countdown (the inline script on the IHERC pages): days,
 * hours, minutes and seconds to the opening. `target` is read in the
 * visitor's local time, as the original did.
 */
export default function Countdown({ target }: { target: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(target).getTime();
    const tick = () => setLeft(end - Date.now());
    tick();
    const t = setInterval(() => {
      tick();
      if (Date.now() > end) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [target]);

  if (left === null) return <div id="clock" className="time-count"></div>;

  if (left < 0) {
    // The original page also ran a template countdown plugin aimed at 2020,
    // which sometimes redrew zeros over this message depending on load
    // timing; the page's own "Countdown Ended" is shown consistently here.
    return (
      <div id="clock" className="time-count">
        <h2 style={{ color: "white" }}>Countdown Ended</h2>
      </div>
    );
  }

  const parts: [number, string][] = [
    [Math.floor(left / 86_400_000), "Days"],
    [Math.floor((left % 86_400_000) / 3_600_000), "Hours"],
    [Math.floor((left % 3_600_000) / 60_000), "Minutes"],
    [Math.floor((left % 60_000) / 1000), "Seconds"],
  ];
  return (
    <div id="clock" className="time-count">
      {parts.map(([n, label]) => (
        <div className="time-box" key={label}>
          <h2>{n}</h2>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
