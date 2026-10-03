import type { Metadata } from "next";
import SiteHeader, { type HeaderAccount } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ScrollUp from "@/components/ScrollUp";
import { initials, readSession } from "@/lib/auth";
import { blogUrl, siteUrl } from "@ihern/core/env";
import { isBlogEditor, isMembershipAdmin } from "@ihern/core/roles";
import { css, u } from "@/lib/paths";

/**
 * The frame every main-site page shares: the PHP site's stylesheets in the
 * same order, the floating navbar, the footer and the back-to-top button.
 * Used by the site layout and by the 404 page (app/global-not-found.tsx).
 * It lives in app/ (a private folder, not a route) because it renders the
 * document <head>, which belongs to the app directory.
 */

// The PHP pages' stylesheet set, in their order. assets/css/ihern-theme.css
// is the design system layered over the original template.
const STYLES = [
  "/assets/css/bootstrap.min.css",
  "/assets/css/font-awesome.min.css",
  "/assets/fonts/flaticon.css",
  "/assets/css/animate.css",
  "/assets/css/off-canvas.css",
  "/assets/css/rsmenu-main.css",
  "/assets/inc/custom-slider/css/nivo-slider.css",
  "/assets/css/rs-spacing.css",
  "/style.css",
  "/assets/css/responsive.css",
  "/assets/css/ihern-theme.css",
  "/assets/css/ihern-next.css",
];

export const SITE_TITLE = "India Higher Education Research Network (IHERN)";

export const siteMetadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_TITLE,
    template: `%s - ${SITE_TITLE}`,
  },
  icons: { shortcut: u("/assets/images/iiit-logo.png"), icon: u("/assets/images/iiit-logo.png") },
};

export default async function SiteDocument({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  let account: HeaderAccount = null;
  if (session) {
    // Two small lookups, only for signed-in readers: which admin areas to offer.
    const [blogEditor, membershipAdmin] = await Promise.all([isBlogEditor(session.email), isMembershipAdmin(session.email)]);
    const admin = [];
    if (blogEditor) admin.push({ label: "Blog admin", href: `${blogUrl()}/admin` });
    if (membershipAdmin) admin.push({ label: "Membership admin", href: u("/membership/admin") });
    account = {
      initials: initials(session.name, session.email),
      name: session.name,
      email: session.email,
      links: [
        { label: "My account", href: u("/account") },
        { label: "IHERN Blog", href: blogUrl() },
      ],
      admin,
      signOut: u("/logout"),
    };
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* The site font, fetched alongside the stylesheets (style.css used to @import it, one request later). */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Poppins:300,400,500,600,700,800,900&display=swap" />
        {STYLES.map((href) => (
          <link key={href} rel="stylesheet" href={css(href)} />
        ))}
      </head>
      <body className="defult-home">
        <a className="ihern-skip" href="#main">Skip to main content</a>
        <div className="offwrap"></div>
        <div className="main-content">
          <SiteHeader account={account} />
          {children}
        </div>
        <SiteFooter />
        <ScrollUp />
      </body>
    </html>
  );
}
