import type { Metadata } from "next";
import { Suspense } from "react";
import BlogHeader from "@/components/BlogHeader";
import BlogFooter from "@/components/BlogFooter";
import Notice from "@/components/Notice";
import ScrollUp from "@/components/ScrollUp";
import { archiveMonths, listTerms } from "@/lib/content";
import { blogUrl } from "@ihern/core/env";
import { headerAccount } from "@/lib/reader";
import { BLOG_DESCRIPTION, BLOG_NAME, mainUrl, navItems } from "@/lib/site";
import { css, u } from "@/lib/paths";

/**
 * The blog's frame: the IHERN header and footer (the main site's own
 * stylesheets, so the two sites look the same) and the blog's styles.
 */

const STYLES = [
  "/assets/css/bootstrap.min.css",
  "/assets/css/font-awesome.min.css",
  "/assets/css/off-canvas.css",
  "/assets/css/rsmenu-main.css",
  "/style.css",
  "/assets/css/responsive.css",
  "/assets/css/ihern-theme.css",
  "/assets/css/ihern-next.css",
  "/assets/css/blog.css",
];

export const metadata: Metadata = {
  metadataBase: new URL(blogUrl() + "/"),
  title: { default: BLOG_NAME, template: `%s - ${BLOG_NAME}` },
  description: BLOG_DESCRIPTION,
  icons: { icon: u("/assets/images/iiit-logo.png"), shortcut: u("/assets/images/iiit-logo.png") },
  alternates: { types: { "application/rss+xml": [{ url: u("/feed"), title: BLOG_NAME }] } },
  openGraph: { siteName: BLOG_NAME, type: "website" },
};

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [account, categories, months] = await Promise.all([headerAccount(), listTerms("category", true), archiveMonths()]);

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
      <body className="defult-home ihern-blog">
        <a className="ihern-skip" href="#main">Skip to main content</a>
        <div className="offwrap"></div>
        <div className="main-content">
          <Suspense fallback={null}>
            <BlogHeader nav={navItems()} account={account} mainHome={mainUrl("")} />
          </Suspense>
          <Suspense fallback={null}>
            <Notice />
          </Suspense>
          {children}
        </div>
        <BlogFooter categories={categories ?? []} months={months ?? []} />
        <ScrollUp />
      </body>
    </html>
  );
}
