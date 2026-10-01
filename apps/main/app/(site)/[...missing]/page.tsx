import { notFound } from "next/navigation";

/** Any address that is not a page renders the site's 404 inside the site frame. */
export default function Missing() {
  notFound();
}
