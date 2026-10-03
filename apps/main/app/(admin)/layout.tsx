import type { Metadata } from "next";
import { u } from "@/lib/paths";
import "@ihern/core/styles/admin.css";

/**
 * The membership admin panel's document (applications/admin on the PHP
 * site). Its frame and look are shared with the blog admin
 * (@ihern/core/ui/AdminFrame, @ihern/core/styles/admin.css), both drawn in
 * the main site's visual language.
 */

export const metadata: Metadata = {
  title: { default: "Membership admin", template: "%s - IHERN membership admin" },
  robots: { index: false, follow: false },
  icons: { shortcut: u("/assets/images/iiit-logo.png"), icon: u("/assets/images/iiit-logo.png") },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* The public site's font request, so it is already cached. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Poppins:300,400,500,600,700,800,900&display=swap" />
      </head>
      <body className="adm">{children}</body>
    </html>
  );
}
