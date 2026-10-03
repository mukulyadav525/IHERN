import type { Metadata } from "next";
import { redirect } from "next/navigation";
import JoinForm from "./JoinForm";
import { currentMember } from "@/lib/membership";
import { safeReturn } from "@/lib/auth";
import { pageMeta } from "@/lib/seo";

/** Join IHERN - the membership form (applications/register.php). */

export const metadata: Metadata = pageMeta(
  "join",
  "Join IHERN - Membership Form",
  "Join IHERN",
  "Apply for membership of the India Higher Education Research Network (IHERN)."
);

export const dynamic = "force-dynamic";

export default async function JoinPage(props: { searchParams: Promise<{ return?: string }> }) {
  // Where to go after signing in (the page "Create account" was clicked on, e.g. a blog post).
  const returnTo = safeReturn((await props.searchParams).return, "");
  // A member who is signed in to the membership area goes to their registration.
  // Only a sign-in the membership system still recognises (a stale cookie would loop with the dashboard).
  const member = await currentMember();
  if (member && member !== "unavailable") redirect("/membership/dashboard");

  return (
    <main id="main">
      <div className="container-fluid bg-primary py-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white">Join IHERN</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="ihern-form-section">
        <div className="container">
          <JoinForm returnTo={returnTo} />
        </div>
      </div>
    </main>
  );
}
