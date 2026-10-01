import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ForgotForm from "./ForgotForm";
import { currentMember } from "@/lib/membership";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  // Only a sign-in the membership system still recognises (a stale cookie would loop with the dashboard).
  const member = await currentMember();
  if (member && member !== "unavailable") redirect("/membership/dashboard");
  return (
    <div className="ihern-auth-page">
      <main className="auth-wrap" id="main">
        <ForgotForm />
      </main>
    </div>
  );
}
