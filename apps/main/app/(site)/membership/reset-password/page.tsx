import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ResetForm from "./ResetForm";
import { resetLinkValid } from "@/lib/membership";

/** Choose a new password from the emailed link (applications/resetpass.php). */

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage(props: { searchParams: Promise<{ id?: string; code?: string }> }) {
  const searchParams = await props.searchParams;
  const id = searchParams.id ?? "";
  const code = searchParams.code ?? "";
  if (!id || !code) redirect("/membership/login");

  const valid = await resetLinkValid(id, code);

  return (
    <div className="ihern-auth-page">
      <main className="auth-wrap" id="main">
        <ResetForm id={id} code={code} initial={{ state: valid === true ? "form" : "invalid", error: "" }} />
      </main>
    </div>
  );
}
