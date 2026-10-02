import SiteDocument, { siteMetadata } from "@/app/_components/SiteDocument";

/** The frame every main-site page shares (components/SiteDocument). */

export const metadata = siteMetadata;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument>{children}</SiteDocument>;
}
