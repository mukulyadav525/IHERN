/** The membership form's fixed choices (safe to import from client components). */

export const TITLES = ["Mr.", "Dr.", "Prof.", "Mrs.", "Ms."] as const;
export const POSITIONS = ["Faculty", "Retired Professor", "Researcher", "PhD Student", "Masters Student", "Other Student", "Any other"] as const;

/**
 * A member's membership number. From 5 October 2026 each new member gets
 * IHERN/<year>-<month><n>, n being their place among that year's members
 * (IHERN/2026-1007: the 7th member of 2026, who joined in October), stored
 * in studentregistration.membershipNo. Members who joined earlier keep the
 * number they were given: IHERN/2025-<registration id>.
 */
export const membershipNumber = (m: { studentID: number | string; membershipNo?: string | null }) => m.membershipNo || `IHERN/2025-${m.studentID}`;

/** IHERN/2026-1007 */
export const formatMembershipNo = (year: number, month: number, n: number) => `IHERN/${year}-${String(month).padStart(2, "0")}${String(n).padStart(2, "0")}`;
