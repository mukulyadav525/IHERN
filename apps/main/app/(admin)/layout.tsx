import type { Metadata } from "next";
import { u } from "@/lib/paths";

/**
 * The membership admin panel's frame (applications/admin on the PHP site):
 * a plain working area with its own stylesheet, not the public site's.
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
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" />
        <link rel="stylesheet" href={u("/assets/css/admin.css")} />
      </head>
      <body className="adm">{children}</body>
    </html>
  );
}
