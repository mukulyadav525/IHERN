"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Two buttons side by side - a link (to the IHERN Blog, or back to the IHERN
 * website) and "Filters" - with the filter panel folded away under them.
 * "Filters" opens the panel; "Hide filters" (on the button, or HideFilters
 * inside the panel) folds it back into the button. Styled by ihern-next.css
 * (.ihern-pair*).
 *
 * The panel starts open when filters are already in use (`active`), so a
 * filtered list never hides why it is filtered.
 */

const Close = createContext<(() => void) | null>(null);

export default function FilterToggle({
  link,
  active = 0,
  panelId,
  children,
}: {
  link: { label: string; href: string };
  /** how many filters are in use: shown on the button while the panel is closed */
  active?: number;
  panelId: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(active > 0);
  const button = useRef<HTMLButtonElement>(null);
  const toggled = useRef(false);

  // Opening moves to the first field; hiding returns to the button (not on page load).
  useEffect(() => {
    if (!toggled.current) return;
    if (open) document.getElementById(panelId)?.querySelector<HTMLElement>("input, select")?.focus({ preventScroll: true });
    else button.current?.focus();
  }, [open, panelId]);
  const toggle = (next: boolean) => {
    toggled.current = true;
    setOpen(next);
  };

  return (
    <Close.Provider value={() => toggle(false)}>
      <div className="ihern-pair">
        <a className="ihern-pair-btn" href={link.href}>
          {link.label}
        </a>
        <button ref={button} type="button" className={`ihern-pair-btn${open ? " is-open" : ""}`} aria-expanded={open} aria-controls={panelId} onClick={() => toggle(!open)}>
          {open ? "Hide filters" : "Filters"}
          {!open && active > 0 ? (
            <span className="ihern-pair-count" aria-label={`${active} in use`}>
              {active}
            </span>
          ) : null}
        </button>
      </div>
      <div id={panelId} className="ihern-pair-panel" hidden={!open}>
        {children}
      </div>
    </Close.Provider>
  );
}

/** "Hide filters", for the panel's own buttons. */
export function HideFilters({ className }: { className: string }) {
  const close = useContext(Close);
  if (!close) return null;
  return (
    <button type="button" className={className} onClick={close}>
      Hide filters
    </button>
  );
}
