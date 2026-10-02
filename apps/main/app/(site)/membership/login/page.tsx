import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MemberLoginForm from "./MemberLoginForm";
import { currentMember } from "@/lib/membership";
import { isFormSubmission } from "@/lib/request";

/** Member sign in (applications/index.php): view your IHERN membership registration. */

export const metadata: Metadata = { title: "Member sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MemberLoginPage() {
  // Only a sign-in the membership system still recognises (a stale cookie would loop with the dashboard).
  // Not while answering this page's own form (see isFormSubmission).
  const member = (await isFormSubmission()) ? null : await currentMember();
  if (member && member !== "unavailable") redirect("/membership/dashboard");

  return (
    <div className="ihern-auth-page">
      <main className="auth-wrap auth-wrap--split" id="main">
        <MemberLoginForm />

        <section className="auth-card auth-info" aria-labelledby="steps-title">
          <h2 id="steps-title">Instructions</h2>
          <ul>
            <li>Join IHERN with your email id. Please fill the email id carefully.</li>
            <li>
              You can get printout of your registration detail anytime through login into dashboard. Please check the website regularly for
              any update.
            </li>
            <li>
              For any query, please mail to <a href="mailto:ihern@iiitd.ac.in">ihern@iiitd.ac.in</a> or call at 011-26907400 during office
              hours.
            </li>
            <li>
              For Technical query only, please mail to <a href="mailto:admin-web@iiitd.ac.in">admin-web@iiitd.ac.in</a> or call at
              011-26907575 during office hours.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
