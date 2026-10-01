"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="b-wrap b-wrap--narrow" id="main">
      <div className="b-card b-empty">
        <h1 className="b-page-title">Something went wrong</h1>
        <p>This page could not be shown just now. Please try again in a moment.</p>
        <p className="b-actions">
          <button type="button" className="b-btn" onClick={() => reset()}>Try again</button>
        </p>
      </div>
    </main>
  );
}
