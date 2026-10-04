import { AdminGate, type AdminLink } from "@ihern/core/ui/AdminFrame";
import { getAccountByEmail } from "@ihern/core/store";
import { blogUrl } from "@ihern/core/env";
import { readInvite, INVITE_PATH } from "@/lib/admin";
import { readSession } from "@/lib/auth";
import { u } from "@/lib/paths";
import ActionButton from "@/components/admin/ActionButton";
import { ActionForm, Submit } from "@/components/admin/Forms";
import { acceptInviteAction, setUpInvitedAccountAction } from "../actions";

export const metadata = { title: "Accept invitation" };
export const dynamic = "force-dynamic";

const LINKS: AdminLink[] = [
  { label: "IHERN website", href: u("/") },
  { label: "IHERN Blog", href: blogUrl() },
];

/**
 * An invitation to the membership admin, from its email (lib/admin.ts):
 * accepted with the IHERN account for the invited address - signed in
 * already, signing in, or set up here.
 */
export default async function AcceptInvitePage(props: { searchParams: Promise<{ token?: string }> }) {
  const token = String((await props.searchParams).token ?? "");
  const [invite, session] = await Promise.all([readInvite(token), readSession()]);
  const here = `${INVITE_PATH}?token=${encodeURIComponent(token)}`;
  const gate = (children: React.ReactNode) => (
    <AdminGate section="Membership admin" home="/membership/admin" ihernHome={u("/")} links={LINKS} wide={false}>
      {children}
    </AdminGate>
  );

  if (invite === "unavailable") {
    return gate(<><h1>Accept invitation</h1><p className="adm-flash adm-flash--error">The membership database could not be reached. Please try again shortly.</p></>);
  }
  if (!invite) {
    return gate(
      <>
        <h1>This invitation has expired</h1>
        <p className="adm-muted">The link is out of date, or has already been used. Ask a membership admin to send a new invitation from Admin users.</p>
        {session ? <p><a className="adm-btn" href={u("/membership/admin")}>Go to the membership admin</a></p> : null}
      </>
    );
  }

  const sameEmail = session && session.email.toLowerCase() === invite.email.toLowerCase();
  if (sameEmail) {
    return gate(
      <>
        <h1>Join the membership admin</h1>
        <p>You have been invited to manage IHERN&apos;s members as <strong>{invite.email}</strong>.</p>
        <p className="adm-muted">You will come in with your IHERN account from now on, with no separate admin password.</p>
        <p className="adm-row">
          <ActionButton action={acceptInviteAction.bind(null, token)} label="Accept and open the membership admin" className="adm-btn" />
        </p>
      </>
    );
  }
  if (session) {
    return gate(
      <>
        <h1>Signed in as someone else</h1>
        <p>
          This invitation is for <strong>{invite.email}</strong>, but you are signed in as {session.email}. Sign out, then open the invitation link again and sign
          in as {invite.email}.
        </p>
        <p><a className="adm-btn" href={u(`/logout?return=${encodeURIComponent(here)}`)}>Sign out</a></p>
      </>
    );
  }

  const account = await getAccountByEmail(invite.email);
  if (account.ok) {
    return gate(
      <>
        <h1>Join the membership admin</h1>
        <p>You have been invited to manage IHERN&apos;s members as <strong>{invite.email}</strong>.</p>
        <p className="adm-muted">Sign in with your IHERN account for this address to accept.</p>
        <p><a className="adm-btn" href={u(`/login?mode=login&return=${encodeURIComponent(here)}`)}>Sign in to accept</a></p>
      </>
    );
  }
  return gate(
    <>
      <h1>Join the membership admin</h1>
      <p>You have been invited to manage IHERN&apos;s members as <strong>{invite.email}</strong>. Set up your IHERN account to accept: you will use it to sign in from now on.</p>
      <ActionForm action={setUpInvitedAccountAction.bind(null, token)}>
        <label className="adm-field"><span>Email</span><input type="email" value={invite.email} readOnly autoComplete="username" /></label>
        <label className="adm-field"><span>Your name</span><input name="name" required maxLength={150} autoComplete="name" /></label>
        <label className="adm-field"><span>Choose a password <em>(10+ characters)</em></span><input type="password" name="password" required minLength={10} autoComplete="new-password" /></label>
        <label className="adm-field"><span>Password again</span><input type="password" name="confirm" required minLength={10} autoComplete="new-password" /></label>
        <div className="adm-row"><Submit label="Set up account and accept" pendingLabel="Setting up…" /></div>
      </ActionForm>
      <p className="adm-muted">
        Already an IHERN member with this address? <a href={u(`/login?mode=login&return=${encodeURIComponent(here)}`)}>Sign in instead</a>.
      </p>
    </>
  );
}
