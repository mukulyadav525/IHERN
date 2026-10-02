"use client";

/** Something went wrong while rendering a page: say so plainly and offer a retry. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <div className="container-fluid bg-primary py-5 mb-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white">Something went wrong</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="rs-about style2 pb-100 md-pb-70">
        <div className="container-xxl">
          <div className="sec-title">
            <p>This page could not be shown just now. Please try again in a moment.</p>
            <div className="btn-part mt-45 md-mt-30">
              <button type="button" className="readon consultant discover" onClick={() => reset()}>
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
