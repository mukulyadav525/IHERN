"use client";

import { useEffect, useRef, useState } from "react";
import type { Media } from "@ihern/core/blog";
import { mediaPath } from "@ihern/core/blog-paths";
import { listMediaAction, uploadMediaAction, type UploadResult } from "@/app/(admin)/admin/actions";
import { u } from "@/lib/paths";

/**
 * Choose an image from the library, or upload one: used for a post's
 * featured image and for images inside the text.
 */
export default function MediaPicker({ onPick, onClose, title = "Choose an image" }: { onPick: (m: Media) => void; onClose: () => void; title?: string }) {
  const [items, setItems] = useState<Media[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
    listMediaAction().then(setItems).catch(() => setError("The library could not be loaded."));
  }, []);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const res: UploadResult = await uploadMediaAction({ ok: false, message: "", error: "" }, fd);
    setBusy(false);
    if (res.error) setError(res.error);
    if (res.media?.length) {
      setItems((prev) => [...(res.media ?? []), ...(prev ?? [])]);
      if (res.media.length === 1) onPick(res.media[0]);
    }
  }

  const shown = (items ?? []).filter((m) => m.mime.startsWith("image/") && (!filter || (m.title + " " + m.alt + " " + m.path).toLowerCase().includes(filter.toLowerCase())));

  return (
    <dialog ref={dialog} className="adm-dialog" onClose={onClose} onCancel={onClose}>
      <div className="adm-dialog-head">
        <h2>{title}</h2>
        <button type="button" className="adm-link" onClick={onClose} aria-label="Close">Close</button>
      </div>
      <div className="adm-dialog-tools">
        <label className="adm-btn">
          {busy ? "Uploading…" : "Upload new"}
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} disabled={busy} />
        </label>
        <input type="search" placeholder="Filter by name" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter images" />
      </div>
      {error ? <p className="adm-flash adm-flash--error" role="alert">{error}</p> : null}
      <div className="adm-media-grid adm-media-grid--pick">
        {items === null ? <p>Loading…</p> : null}
        {items !== null && !shown.length ? <p>No images yet. Upload one above.</p> : null}
        {shown.map((m) => (
          <button key={m.id} type="button" className="adm-media-item" onClick={() => onPick(m)} title={m.title}>
            <img src={u(mediaPath(m.path, 320))} alt={m.alt} loading="lazy" />
            <span>{m.title || m.path.split("/").pop()}</span>
          </button>
        ))}
      </div>
    </dialog>
  );
}
