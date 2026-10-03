import Link from "next/link";

/**
 * Members carried over from the old website keep their email, but sign in to
 * the new one only after choosing a password again (Forgot password). Shown
 * on both sign-in pages.
 */
export default function OldMemberNote() {
  return (
    <p className="auth-note">
      <strong>Joined IHERN before 5 October 2026?</strong> Please reset your password once to sign in to the new website:{" "}
      <Link href="/membership/forgot-password">Reset your password</Link>.
    </p>
  );
}
