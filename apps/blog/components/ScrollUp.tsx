"use client";

import { useEffect, useState } from "react";
import { animateScroll } from "@/lib/scroll";

/** The back-to-top button (main.js: shown after 150px of scrolling). */
export default function ScrollUp() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 150);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      id="scrollUp"
      className="orange-color"
      role="button"
      tabIndex={shown ? 0 : -1}
      aria-label="Back to top"
      style={{ display: shown ? "block" : "none" }}
      onClick={() => animateScroll(0, 500)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          animateScroll(0, 500);
        }
      }}
    >
      {" "}
      <i className="fa fa-angle-up"></i>{" "}
    </div>
  );
}
