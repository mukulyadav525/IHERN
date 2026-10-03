import Link from "next/link";
import ImportForm from "./ImportForm";
import { IMPORT_MAX_ROWS } from "@/lib/member-import";

export const metadata = { title: "Import members" };
export const dynamic = "force-dynamic";

/** Members from a CSV file: the export's own columns, checked before anything changes. */
export default function ImportMembersPage() {
  return (
    <>
      <header className="adm-head">
        <h1>Import members</h1>
        <Link className="adm-btn adm-btn--ghost" href="/membership/admin/members">Back to members</Link>
      </header>
      <div className="adm-two">
        <section className="adm-card">
          <h2>Choose a file</h2>
          <ImportForm />
        </section>
        <section className="adm-card">
          <h2>The file</h2>
          <ul className="adm-list">
            <li>A CSV file, up to {IMPORT_MAX_ROWS} rows and 2 MB, with a heading row. In a spreadsheet: Save as (or Download as) → CSV.</li>
            <li>
              The columns of the export work as they are, so you can export, edit and import again. A name column and an email column are needed;
              the others (mobile, organisation, title, interests, website, registration date, status) are optional, in any order.
            </li>
            <li>One row per member. A row whose email address is already registered is left alone, unless you choose to update it: then its non-empty cells replace what is stored.</li>
            <li>New members get no password. They set one with “Forgot password” on the member sign-in page.</li>
            <li>Membership numbers and photographs are not imported: numbers are given automatically, and photographs are added on a member’s page.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
