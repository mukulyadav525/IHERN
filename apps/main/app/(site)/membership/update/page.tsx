import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileForm, { type ProfileValues } from "./ProfileForm";
import { currentMember, membershipNumber, POSITIONS, splitTitle } from "@/lib/membership";
import { getMember } from "@/lib/admin";
import { readUpdateToken, usedUpdateToken } from "@/lib/profile-update";

/**
 * A member's own details, to check and update: from the link in a "please
 * update your details" email (no password needed), or from My membership.
 */

export const metadata: Metadata = { title: "Update my details", robots: { index: false } };
export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main">
      <div className="container-fluid bg-primary py-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white">Update my details</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="ihern-form-section">
        <div className="container">{children}</div>
      </div>
    </main>
  );
}

function Problem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Shell>
      <section className="ihern-form-card ihern-form-done">
        <h2>{title}</h2>
        {children}
      </section>
    </Shell>
  );
}

export default async function UpdateDetailsPage(props: { searchParams: Promise<{ token?: string }> }) {
  const token = String((await props.searchParams).token ?? "");
  const signedIn = await currentMember();
  let id: number;
  if (token) {
    const t = await readUpdateToken(token);
    if (t === "unavailable") return <Problem title="Please try again shortly"><p>The membership service is temporarily unavailable.</p></Problem>;
    // Used: just now (this page again, after saving) or earlier.
    const used = t === null ? await usedUpdateToken(token) : null;
    if (used) {
      return (
        <Problem title="Your details are updated">
          <p>Thank you. Your IHERN membership details were updated on {used}. To change them again, sign in as a member, then choose Update my details.</p>
          <p className="ihern-form-actions"><Link className="btn-ihern" href="/">Back to the IHERN home page</Link></p>
        </Problem>
      );
    }
    if (t === null) {
      return (
        <Problem title="This link has expired">
          <p>The link is out of date, or a newer one has been sent to you. You can still update your details: sign in as a member, then choose Update my details.</p>
          <p className="ihern-form-actions"><Link className="btn-ihern" href="/membership/login">Member sign in</Link></p>
        </Problem>
      );
    }
    id = t;
  } else {
    if (signedIn === null) redirect("/membership/login");
    if (signedIn === "unavailable") return <Problem title="Please try again shortly"><p>The membership service is temporarily unavailable.</p></Problem>;
    id = Number(signedIn.studentID);
  }
  const m = await getMember(id);
  if (!m || m === "error") return <Problem title="Please try again shortly"><p>Your membership details could not be read just now.</p></Problem>;

  const [title, name] = splitTitle(m.studentName);
  const listed = (POSITIONS as readonly string[]).includes(m.yourTitle);
  const values: ProfileValues = {
    title,
    name,
    email: m.studentEmail,
    number: membershipNumber(m),
    mobile: m.studentMobile,
    institutionName: m.institutionName,
    areasofinterest: m.areasofinterest,
    position: listed ? m.yourTitle : m.yourTitle ? "Any other" : "",
    other: listed ? "" : m.yourTitle,
    areasofinteresthe: m.areasofinteresthe,
    url: m.url,
    hasPhoto: Boolean(m.photo),
  };
  return (
    <Shell>
      <div className="ihern-form-intro">
        <p>Please check your IHERN membership details, and change anything that is out of date. Your name, affiliation and areas of interest may be listed on the IHERN <Link href="/members">Members</Link> page.</p>
      </div>
      <ProfileForm values={values} token={token} signedIn={Boolean(signedIn && signedIn !== "unavailable")} />
    </Shell>
  );
}
