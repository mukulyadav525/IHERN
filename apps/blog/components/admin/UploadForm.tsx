"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadMediaAction, type UploadResult } from "@/app/(admin)/admin/actions";
import Result from "./Result";
import { Submit } from "./Forms";

/** Upload images (JPEG, PNG, GIF, WebP) or PDFs, up to 10 MB each. */
export default function UploadForm() {
  const [state, run] = useActionState(uploadMediaAction, { ok: false, message: "", error: "" } as UploadResult);
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state, router]);
  return (
    <form ref={ref} action={run} className="adm-form adm-form--inline">
      <Result state={state} />
      <label className="adm-field"><span>Files</span><input type="file" name="files" multiple required accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" /></label>
      <label className="adm-field"><span>Description <em>(alt text, optional)</em></span><input name="alt" maxLength={500} /></label>
      <Submit label="Upload" pendingLabel="Uploading…" />
    </form>
  );
}
