/** The membership form's fixed choices (safe to import from client components). */

export const TITLES = ["Mr.", "Dr.", "Prof.", "Mrs.", "Ms."] as const;
export const POSITIONS = ["Faculty", "Retired Professor", "Researcher", "PhD Student", "Masters Student", "Other Student", "Any other"] as const;

/** Membership numbers as the membership system has always issued them. */
export const membershipNumber = (id: number) => `IHERN/2025-${id}`;
