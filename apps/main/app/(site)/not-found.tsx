import Link from "next/link";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <div className="container-fluid bg-primary py-5 mb-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white">Page not found</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="rs-about style2 pb-100 md-pb-70">
        <div className="container-xxl">
          <div className="sec-title">
            <p>The page you were looking for is not here. It may have moved, or the address may be mistyped.</p>
            <div className="btn-part mt-45 md-mt-30">
              {" "}
              <Link className="readon consultant discover" href="/">
                Go to the IHERN home page
              </Link>{" "}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
