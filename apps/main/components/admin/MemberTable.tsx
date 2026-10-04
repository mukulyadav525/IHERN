import Link from "next/link";
import ActionButton from "./ActionButton";
import { membershipNumber } from "@/lib/membership-options";
import { u } from "@/lib/paths";
import type { MemberRecord } from "@/lib/admin";
import type { UpdateRequest } from "@/lib/profile-update";
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

/** Where a "please update your details" request stands, under the status. */
function RequestNote({ r }: { r: UpdateRequest | undefined }) {
  if (!r) return null;
  if (r.completedAt) return <div className="adm-muted adm-nowrap">Details updated {r.completedAt.slice(0, 10)}</div>;
  const now = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " ");
  return <div className="adm-muted adm-nowrap">{r.expiresAt > now ? `Asked to update ${r.requestedAt.slice(0, 10)}` : "Update request expired"}</div>;
}

/**
 * The registered-members table (adminDashboard.php), with the row actions.
 * `selectable` adds a tick box per row for the bulk actions (MemberBulk's form).
 */
export default function MemberTable({
  rows,
  compact = false,
  selectable = false,
  requests,
}: {
  rows: MemberRecord[];
  compact?: boolean;
  selectable?: boolean;
  requests?: Map<number, UpdateRequest>;
}) {
  return (
    <div className="adm-table-wrap">
      <table className="adm-table adm-members">
        <thead>
          <tr>
            {selectable ? <th scope="col" className="adm-select-cell"><span className="adm-sr">Select</span></th> : null}
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
              {selectable ? (
                <td className="adm-select-cell">
                  <input type="checkbox" name="ids" value={m.studentID} form="member-bulk" aria-label={`Select ${m.studentName || membershipNumber(m)}`} />
                </td>
              ) : null}
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
                <div className="adm-muted adm-nowrap">{membershipNumber(m)}</div>
              </td>
              <td data-label="Contact">
                <a href={`mailto:${m.studentEmail}`} className="adm-email">
                  {/* a long address breaks before the @, not mid-word */}
                  {m.studentEmail.split("@")[0]}
                  {m.studentEmail.includes("@") ? <><wbr />@{m.studentEmail.split("@").slice(1).join("@")}</> : null}
                </a>
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
                <RequestNote r={requests?.get(m.studentID)} />
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
                  confirm={`Delete the registration of ${m.studentName} (${membershipNumber(m)}) and their photograph? This cannot be undone.`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
