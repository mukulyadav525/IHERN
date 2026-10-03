import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "./AuthForm";
import { readSession, safeReturn } from "@/lib/auth";
import { isFormSubmission } from "@/lib/request";
import { googleEnabled } from "@/lib/oauth";
import { domainHint } from "@ihern/core/store";

/**
 * Sign in or create an IHERN account (blog-login.php). One account for the
 * website and the blog; members who joined through the membership form sign
 * in with the same email and password.
 */

type Search = { mode?: string; return?: string; error?: string };

export async function generateMetadata(props: { searchParams: Promise<Search> }): Promise<Metadata> {
  const searchParams = await props.searchParams;
  return {
    title: "Sign in",
    robots: { index: false },
  };
}

export const dynamic = "force-dynamic";

/** Messages for a Google sign-in that came back unsuccessful (blog-oauth.php's wording). */
function googleError(code: string | undefined): string {
  switch (code) {
    case "google_off": return "Google sign-in is not configured.";
    case "state": return "Sign-in request could not be verified. Please try again.";
    case "cancelled": return "Google sign-in was cancelled.";
    case "no_code": return "Google did not return an authorization code.";
    case "google_failed": return "Could not complete Google sign-in. Please try again.";
    case "unverified": return "That Google account has an unverified email address.";
    case "domain": return `That email address is not permitted. ${domainHint()}`.trim();
    case "unavailable": return "The account service is temporarily unavailable.";
    default: return "";
  }
}

export default async function LoginPage(props: { searchParams: Promise<Search> }) {
  const searchParams = await props.searchParams;
  const returnTo = safeReturn(searchParams.return);
  const mode = "login" as const;

  // "Create account" is the membership form: everyone who signs up is a
  // registered member, so IHERN knows who uses the site. (Members then sign
  // in here with the email and password they chose.)
  if (searchParams.mode === "register") redirect(searchParams.return ? `/join?return=${encodeURIComponent(returnTo)}` : "/join");

  if (!(await isFormSubmission()) && (await readSession())) redirect(returnTo);

  return (
    <div className="ihern-auth-page">
      <main className="auth-wrap" id="main">
        <AuthForm
          key={mode}
          initial={{ mode, error: googleError(searchParams.error), email: "", name: "" }}
          returnTo={returnTo}
          googleOn={googleEnabled()}
          domainHint={domainHint()}
        />
      </main>
    </div>
  );
}
