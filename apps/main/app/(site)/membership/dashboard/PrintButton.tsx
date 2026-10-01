"use client";

/** Prints the membership details (the page's print styles leave only the table). */
export default function PrintButton() {
  return (
    <button type="button" className="auth-submit hidden-print" onClick={() => window.print()}>
      Print
    </button>
  );
}
