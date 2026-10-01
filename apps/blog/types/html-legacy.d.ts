import "react";

/*
 * The PHP pages mark paragraphs with the legacy `align="justify"` attribute,
 * and the stylesheets select on it (p[align="justify"]). React renders the
 * attribute; this only tells TypeScript that it is allowed.
 */
declare module "react" {
  interface HTMLAttributes<T> {
    align?: string;
  }
}
