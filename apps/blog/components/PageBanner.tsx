/**
 * The page banner of the main IHERN website's inner pages (About, Blogs,
 * Join ...): the same markup and classes, so ihern-theme.css draws it the
 * same way - the navy band, the large white title and its accent rule.
 * `kind` is a small label above the title ("Category", "Author").
 */
export default function PageBanner({
  title,
  kind,
  titleClass = "b-page-title",
  children,
}: {
  title: string;
  kind?: string;
  titleClass?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="container-fluid bg-primary py-5 page-header b-banner">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10 text-center">
            {kind ? <p className="b-banner-kind">{kind}</p> : null}
            <h1 className={`display-3 text-white ${titleClass}`}>{title}</h1>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
