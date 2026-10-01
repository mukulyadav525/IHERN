"use client";

import { useMemo, useState } from "react";
import type { DirectoryEntry } from "@/lib/membership";

/**
 * The searchable member directory on the Members page (members.php): one
 * search box over name, designation, affiliation and interest, a live count,
 * and serial numbers that follow the filtered list.
 */
export default function MemberDirectory({ members }: { members: DirectoryEntry[] }) {
  const [term, setTerm] = useState("");

  const rows = useMemo(
    () => members.map((m) => ({ ...m, hay: `${m.name} ${m.designation} ${m.affiliation} ${m.area}`.trim().toLowerCase() })),
    [members]
  );
  const q = term.trim().toLowerCase();
  let shown = 0;

  const body = rows.map((r, i) => {
    const hit = !q || r.hay.includes(q);
    if (hit) shown++;
    return (
      <tr key={i} data-search={r.hay} hidden={!hit}>
        <td className="mem-idx">{hit ? shown : i + 1}</td>
        <td className="mem-name">{r.name}</td>
        {[r.designation, r.affiliation, r.area].map((cell, j) => (
          <td key={j}>
            {cell.trim() === "" ? (
              <span className="mem-na" aria-label="Not provided">
                &mdash;
              </span>
            ) : (
              cell
            )}
          </td>
        ))}
      </tr>
    );
  });

  return (
    <>
      <div className="mem-toolbar">
        <div className="mem-search">
          <label htmlFor="mem-q">Search members</label>{" "}
          <input
            type="search"
            id="mem-q"
            autoComplete="off"
            placeholder="Search by name, designation, affiliation or interest…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <div className="mem-count">
          <span id="mem-count" aria-live="polite">
            {shown} {shown === 1 ? "member" : "members"}
          </span>
        </div>
      </div>

      <div className="mem-frame">
        <div className="mem-scroll" tabIndex={0} role="region" aria-label="Member directory">
          <table className="mem-table">
            <thead>
              <tr>
                <th scope="col">S.No.</th>
                <th scope="col">Name</th>
                <th scope="col">Designation</th>
                <th scope="col">Affiliation</th>
                <th scope="col">Area of Interest</th>
              </tr>
            </thead>
            <tbody id="mem-body">{body}</tbody>
          </table>
          <p className="mem-empty" id="mem-empty" hidden={shown !== 0}>
            No members match that search.
          </p>
        </div>
      </div>
    </>
  );
}
