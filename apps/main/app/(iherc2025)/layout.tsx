import type { Metadata } from "next";
import IhercBehaviour from "@/components/iherc/IhercBehaviour";
import { siteUrl } from "@ihern/core/env";
import { css, u } from "@/lib/paths";

/**
 * The IHERC 2025 conference microsite: its own stylesheets (the template's,
 * with the IHERN brand layer on top) and the small amount of behaviour its
 * pages need. The pages themselves are app/(iherc2025)/iherc2025/*.
 */

const STYLES = [
  "/iherc2025/assets/css/bootstrap.min.css",
  "/iherc2025/assets/fonts/line-icons.css",
  "/iherc2025/assets/css/nivo-lightbox.css",
  "/iherc2025/assets/css/animate.css",
  "/iherc2025/assets/css/main.css",
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  icons: { shortcut: u("/assets/images/iiit-logo.png"), icon: u("/assets/images/iiit-logo.png") },
};

export default function Iherc2025Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {STYLES.map((href) => (
          <link key={href} rel="stylesheet" href={css(href)} />
        ))}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" />
        <link rel="stylesheet" href={css("/iherc2026/assets/css/ihern-brand.css")} />
      </head>
      <body>
        {children}
        <IhercBehaviour />
      </body>
    </html>
  );
}
