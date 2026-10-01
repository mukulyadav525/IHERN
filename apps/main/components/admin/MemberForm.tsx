"use client";

import { useState } from "react";
import { ActionForm, Submit } from "./Forms";
import { POSITIONS } from "@/lib/membership-options";
import type { ActionResult } from "@/app/(admin)/membership/admin/actions";
import type { MemberRecord } from "@/lib/admin";

/** A registration's details, as the membership form collects them. */
export default function MemberForm({
  member: m,
  action,
  photo,
}: {
  member: MemberRecord;
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  photo: string;
}) {
  const listed = (POSITIONS as readonly string[]).includes(m.yourTitle) || !m.yourTitle;
  const [position, setPosition] = useState(listed ? m.yourTitle : "Any other");
  const [removePhoto, setRemovePhoto] = useState(false);
  return (
    <ActionForm action={action}>
      <div className="adm-grid2">
        <label className="adm-field"><span>Full name</span><input name="studentName" defaultValue={m.studentName} maxLength={100} required /></label>
        <label className="adm-field"><span>Status</span>
          <select name="userStatus" defaultValue={m.userStatus}>
            <option value="Y">Active</option>
            <option value="N">Inactive (cannot sign in; not exported)</option>
          </select>
        </label>
        <label className="adm-field"><span>Email</span><input type="email" name="studentEmail" defaultValue={m.studentEmail} maxLength={100} required /></label>
        <label className="adm-field"><span>Mobile number</span><input type="tel" name="studentMobile" defaultValue={m.studentMobile} maxLength={50} required /></label>
        <label className="adm-field"><span>Position</span>
          <select name="yourTitle" value={position} onChange={(e) => setPosition(e.target.value)}>
            <option value="">—</option>
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        {position === "Any other" ? (
          <label className="adm-field"><span>Position (as written)</span><input name="anyothervalue" defaultValue={listed ? "" : m.yourTitle} maxLength={100} /></label>
        ) : <span />}
        <label className="adm-field"><span>Organization</span><input name="institutionName" defaultValue={m.institutionName} maxLength={200} /></label>
        <label className="adm-field"><span>Website</span><input name="url" defaultValue={m.url} maxLength={255} inputMode="url" /></label>
      </div>
      <label className="adm-field"><span>Department / areas of research interest</span><textarea name="areasofinterest" rows={2} defaultValue={m.areasofinterest} /></label>
      <label className="adm-field"><span>Areas of research interest in higher education</span><textarea name="areasofinteresthe" rows={3} defaultValue={m.areasofinteresthe} /></label>
      <fieldset className="adm-photo-field">
        <legend>Photograph</legend>
        {photo && !removePhoto ? (
           
          <img src={photo} alt={`Photograph of ${m.studentName}`} className="adm-photo" />
        ) : (
          <p className="adm-muted">{photo ? "The photograph will be removed when you save." : "No photograph."}</p>
        )}
        <label className="adm-field"><span>{photo ? "Replace with" : "Add"} <em>(JPEG or PNG, up to 5 MB)</em></span><input type="file" name="photo" accept="image/jpeg,image/png" /></label>
        {photo ? (
          <label className="adm-check">
            <input type="checkbox" name="removePhoto" value="1" checked={removePhoto} onChange={(e) => setRemovePhoto(e.target.checked)} /> Remove the photograph
          </label>
        ) : null}
      </fieldset>
      <div className="adm-row"><Submit label="Save changes" /></div>
    </ActionForm>
  );
}
