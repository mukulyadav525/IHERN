import type { Metadata } from "next";
import { absoluteUrl } from "@ihern/core/env";

/**
 * Description, canonical URL and Open Graph tags for a page - the same tags
 * includes/seo.php writes. `title` is the document title (the layout appends
 * " - India Higher Education Research Network (IHERN)"); `ogTitle` is the
 * share title, as in ihern_seo().
 */
export function pageMeta(path: string, title: string | null, ogTitle: string, description: string | null): Metadata {
  const url = absoluteUrl(path);
  if (!description) {
    // A page with no description: title and canonical only.
    return { ...(title === null ? {} : { title }), alternates: { canonical: url } };
  }
  return {
    ...(title === null ? {} : { title }),
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "India Higher Education Research Network (IHERN)",
      title: ogTitle,
      description,
      url,
    },
    twitter: { card: "summary" },
  };
}
