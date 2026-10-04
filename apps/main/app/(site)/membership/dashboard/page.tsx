import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import PrintButton from "./PrintButton";
import { currentMember, membershipNumber } from "@/lib/membership";
import { u } from "@/lib/paths";

/**
 * The member's own registration (applications/dashboard.php): the membership
 * details for IHERN, printable. Reached by signing in at /membership/login.
 */

export const metadata: Metadata = { title: "My membership", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MemberDashboardPage() {
  const member = await currentMember();
  if (member === null) redirect("/membership/login");

  return (
    <div className="ihern-auth-page">
      <main className="auth-wrap" id="main">
        <div className="auth-card member-card">
          {member === "unavailable" ? (
            <>
              <h1 className="auth-title">My membership</h1>
              <div className="auth-alert" role="alert">
                The membership service is temporarily unavailable. Please try again shortly.
              </div>
            </>
          ) : (
            <>
              <h1 className="auth-title">My membership</h1>
              <p className="auth-sub">Thank you for being a part of IHERN.</p>

              <div id="printableArea">
                <table className="member-details">
                  <caption>Membership Details for IHERN</caption>
                  <tbody>
                    <tr><th scope="row">Membership Number</th><td>{membershipNumber(member)}</td></tr>
                    <tr><th scope="row">Name</th><td>{member.studentName}</td></tr>
                    <tr><th scope="row">Email ID</th><td>{member.studentEmail}</td></tr>
                    <tr><th scope="row">Mobile Number</th><td>{member.studentMobile}</td></tr>
                    <tr><th scope="row">Institution Name</th><td>{member.institutionName}</td></tr>
                    <tr><th scope="row">Position</th><td>{member.yourTitle}</td></tr>
                    <tr><th scope="row">Areas of Research Interest</th><td>{member.areasofinterest}</td></tr>
                    <tr><th scope="row">Areas of Research Interest in Higher Education</th><td>{member.areasofinteresthe}</td></tr>
                    <tr><th scope="row">Website Link</th><td>{member.url}</td></tr>
                    <tr><th scope="row">Registration Date &amp; Time (yyyy-mm-dd h:m:s)</th><td>{member.regDate}</td></tr>
                  </tbody>
                </table>
              </div>

              <p className="member-actions">
                <Link className="auth-secondary" href="/membership/update">
                  Update my details
                </Link>
                <PrintButton />
                <a className="auth-secondary member-signout" href={u("/membership/logout")}>
                  Sign out
                </a>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
