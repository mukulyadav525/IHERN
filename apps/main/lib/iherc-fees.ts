/**
 * IHERC 2026 registration fees: the one place they are written down. The
 * registration page's table, the amount it tells each person to pay, and the
 * IHERC admin's payment checks all read these.
 *
 * IHERN pays half the fee for IHERN members and for students, so they pay the
 * discounted rate; everyone else pays the full amount. Fees are exclusive of
 * GST; the payment form asks for the amount including 18% GST.
 *
 * No server code here: the registration page's browser code uses it too.
 */

export type FeeCategory = "member" | "student" | "standard";

export const GST_PERCENT = 18;

export const FEES: Record<FeeCategory, { label: string; amount: number; discounted: number | null }> = {
  member: { label: "IHERN Members", amount: 8000, discounted: 4000 },
  standard: { label: "Non-IHERN members/faculty/researchers", amount: 12000, discounted: null },
  student: { label: "Students", amount: 3000, discounted: 1500 },
};

/** The order the fee table lists them in. */
export const FEE_ORDER: FeeCategory[] = ["member", "standard", "student"];

/** What this category pays, before GST. */
export const feeFor = (c: FeeCategory) => FEES[c].discounted ?? FEES[c].amount;

/** With 18% GST, in whole rupees: what goes in the payment form's Amount box. */
export const withGst = (n: number) => Math.round((n * (100 + GST_PERCENT)) / 100);

/** What this category enters as the amount (GST included). */
export const payableFor = (c: FeeCategory) => withGst(feeFor(c));

/** "Rs. 14,160" */
export const rupees = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;

/** The finance department's payment form (it cannot be changed from here). */
export const PAYMENT_FORM = "https://form.qfixonline.com/iherclink";
