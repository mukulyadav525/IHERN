import Link from "next/link";
import { notFound } from "next/navigation";
import { getMember } from "@/lib/admin";
import { membershipNumber } from "@/lib/membership-options";
import ActionButton from "@/components/admin/ActionButton";
import MemberForm from "@/components/admin/MemberForm";
import { photoUrl } from "@/components/admin/MemberTable";
import { updateRequests } from "@/lib/profile-update";
import { deleteMemberAction, requestUpdateAction, saveMemberAction, sendMemberResetAction } from "../../../actions";

export const metadata = { title: "Member" };
export const dynamic = "force-dynamic";

export default async function MemberPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!/^\d+$/.test(params.id)) notFound();
  const id = Number(params.id);
  const m = await getMember(id);
  if (m === "error") return <p className="adm-flash adm-flash--error">The membership database could not be reached.</p>;
  if (!m) notFound();
  const request = (await updateRequests([id])).get(id);
  return (
    <>
      <header className="adm-head">
        <div>
          <p className="adm-muted"><Link href="/membership/admin/members">← Members</Link></p>
          <h1>{m.studentName || "(no name)"}</h1>
        </div>
      </header>
      <div className="adm-editor">
        <section className="adm-editor-main">
          <MemberForm member={m} action={saveMemberAction.bind(null, id)} photo={m.photo ? photoUrl(m.photo) : ""} />
        </section>
        <aside className="adm-editor-side">
          <div className="adm-card">
            <h2>Membership</h2>
            <dl className="adm-facts">
              <dt>Membership number</dt><dd>{membershipNumber(m)}</dd>
              <dt>Registered</dt><dd>{m.regDate}</dd>
              <dt>Status</dt><dd><span className={`adm-status ${m.userStatus === "Y" ? "is-on" : "is-off"}`}>{m.userStatus === "Y" ? "Active" : "Inactive"}</span></dd>
            </dl>
          </div>
          <div className="adm-card">
            <h2>Member&apos;s own update</h2>
            <p className="adm-muted">
              {request?.completedAt
                ? `They last updated their details on ${request.completedAt.slice(0, 10)}. `
                : request
                  ? `Asked on ${request.requestedAt.slice(0, 10)}${request.requestedBy ? ` by ${request.requestedBy}` : ""}; not updated yet. `
                  : ""}
              This emails {m.studentEmail} a link to check and update their details and photograph themselves, no password needed (it works for 14 days).
            </p>
            <ActionButton action={requestUpdateAction.bind(null, id)} label="Ask them to update their details" className="adm-btn adm-btn--ghost adm-btn--small" showMessage />
          </div>
          <div className="adm-card">
            <h2>Password</h2>
            <p className="adm-muted">Members choose their own password. This emails {m.studentEmail} a link to set a new one.</p>
            <ActionButton action={sendMemberResetAction.bind(null, id)} label="Email a password reset link" className="adm-btn adm-btn--ghost adm-btn--small" showMessage />
          </div>
          <div className="adm-card">
            <h2>Delete</h2>
            <p className="adm-muted">Removes the registration and photograph for good. To keep the record but stop the membership, set it to inactive instead.</p>
            <ActionButton
              action={deleteMemberAction.bind(null, id)}
              label="Delete this registration"
              className="adm-btn adm-btn--danger adm-btn--small"
              confirm={`Delete the registration of ${m.studentName} (${membershipNumber(m)}) and their photograph? This cannot be undone.`}
              after="/membership/admin/members"
            />
          </div>
        </aside>
      </div>
    </>
  );
}
