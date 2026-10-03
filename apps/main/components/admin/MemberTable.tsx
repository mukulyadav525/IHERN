import Link from "next/link";
import ActionButton from "./ActionButton";
import { membershipNumber } from "@/lib/membership-options";
import { u } from "@/lib/paths";
import type { MemberRecord } from "@/lib/admin";
import { deleteMemberAction, setMemberStatusAction } from "@/app/(admin)/membership/admin/actions";

export const photoUrl = (photo: string) => u(`/membership/admin/photo/${encodeURIComponent(photo)}`);

function Website({ url }: { url: string }) {
  if (!url) return null;
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="adm-wrap">
      {url.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
    </a>
  );
}

/** The registered-members table (adminDashboard.php), with the row actions. */
export default function MemberTable({ rows, compact = false }: { rows: MemberRecord[]; compact?: boolean }) {
  return (
    <div className="adm-table-wrap">
      <table className="adm-table adm-members">
        <thead>
          <tr>
            <th scope="col"><span className="adm-sr">Photo</span></th>
            <th scope="col">Name</th>
            <th scope="col">Contact</th>
            <th scope="col">Position &amp; organization</th>
            {compact ? null : <th scope="col">Interests</th>}
            <th scope="col">Registered</th>
            <th scope="col">Status</th>
            <th scope="col"><span className="adm-sr">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.studentID}>
              <td className="adm-photo-cell">
                {m.photo ? (
                  <a href={photoUrl(m.photo)} target="_blank" rel="noopener">
                    { }
                    <img className="adm-thumb" src={photoUrl(m.photo)} alt={`Photograph of ${m.studentName}`} loading="lazy" width={44} height={44} />
                  </a>
                ) : (
                  <span className="adm-thumb adm-thumb--none" aria-hidden="true">{(m.studentName.replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, "")[0] || "?").toUpperCase()}</span>
                )}
              </td>
              <td>
                <Link className="adm-strong" href={`/membership/admin/members/${m.studentID}`}>{m.studentName || "(no name)"}</Link>
                <div className="adm-muted adm-nowrap">{membershipNumber(m.studentID)}</div>
              </td>
              <td data-label="Contact">
                <a href={`mailto:${m.studentEmail}`} className="adm-wrap">{m.studentEmail}</a>
                <div className="adm-muted">{m.studentMobile}</div>
              </td>
              <td data-label="Position">
                {m.yourTitle}
                {m.institutionName ? <div className="adm-muted">{m.institutionName}</div> : null}
                <Website url={m.url} />
              </td>
              {compact ? null : (
                <td className="adm-interests" data-label="Interests">
                  {m.areasofinterest ? <div><span className="adm-label">Research / dept.</span> {m.areasofinterest}</div> : null}
                  {m.areasofinteresthe ? <div><span className="adm-label">Higher education</span> {m.areasofinteresthe}</div> : null}
                </td>
              )}
              <td className="adm-nowrap" data-label="Registered">{m.regDate.slice(0, 10)}<div className="adm-muted">{m.regDate.slice(11, 16)}</div></td>
              <td data-label="Status">
                <span className={`adm-status ${m.userStatus === "Y" ? "is-on" : "is-off"}`}>{m.userStatus === "Y" ? "Active" : "Inactive"}</span>
              </td>
              <td className="adm-actions">
                <Link className="adm-link" href={`/membership/admin/members/${m.studentID}`}>Edit</Link>
                {m.userStatus === "Y" ? (
                  <ActionButton action={setMemberStatusAction.bind(null, m.studentID, false)} label="Deactivate" confirm={`Deactivate ${m.studentName}? They will not be able to sign in, and will not be in the export.`} />
                ) : (
                  <ActionButton action={setMemberStatusAction.bind(null, m.studentID, true)} label="Activate" />
                )}
                <ActionButton
                  action={deleteMemberAction.bind(null, m.studentID)}
                  label="Delete"
                  className="adm-link adm-danger"
                  confirm={`Delete the registration of ${m.studentName} (${membershipNumber(m.studentID)}) and their photograph? This cannot be undone.`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
