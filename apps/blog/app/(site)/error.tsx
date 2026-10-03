"use client";

import PageBanner from "@/components/PageBanner";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main">
      <PageBanner title="Something went wrong" />
      <div className="b-wrap b-wrap--narrow b-wrap--message">
        <p>This page could not be shown just now. Please try again in a moment.</p>
        <p className="b-actions">
          <button type="button" className="b-btn" onClick={() => reset()}>Try again</button>
        </p>
      </div>
    </main>
  );
}
