"use client";

import { useEffect, useRef, useState } from "react";
import type { Media } from "@ihern/core/blog";
import { mediaPath } from "@ihern/core/blog-paths";
import MediaPicker from "./MediaPicker";
import { u } from "@/lib/paths";

/**
 * The author's picture: chosen from the image library (or uploaded there),
 * like a post's featured image. Saved with the rest of the author's form
 * through the hidden photo_media_id field.
 */
export default function AuthorPhoto({ name, initial }: { name: string; initial: { id: number; path: string } | null }) {
  const [photo, setPhoto] = useState(initial);
  const [picking, setPicking] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // When the form is cleared after "Add author", clear the photo too. Resets
  // the form refuses (Forms.tsx useKeepValues) are left alone.
  useEffect(() => {
    const form = box.current?.closest("form");
    if (!form) return;
    const onReset = (e: Event) => queueMicrotask(() => {
      if (!e.defaultPrevented) setPhoto(initial);
    });
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [initial]);

  return (
    <div className="adm-field adm-author-photo" ref={box}>
      <span>Photo</span>
      <input type="hidden" name="photo_media_id" value={photo?.id ?? ""} />
      <div className="adm-author-photo-row">
        {photo ? (
          <img className="adm-author-photo-img" src={u(mediaPath(photo.path, 320))} alt={name ? `Photo of ${name}` : "Author photo"} width={72} height={72} />
        ) : (
          <span className="adm-author-photo-img adm-author-photo-img--none" aria-hidden="true">
            {(name.trim()[0] || "?").toUpperCase()}
          </span>
        )}
        <div className="adm-row">
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--small" onClick={() => setPicking(true)}>
            {photo ? "Change photo" : "Add photo"}
          </button>
          {photo ? (
            <button type="button" className="adm-link adm-danger" onClick={() => setPhoto(null)}>
              Remove
            </button>
          ) : null}
          <small>Shown beside their name on posts and on their author page. Save to keep the change.</small>
        </div>
      </div>
      {picking ? (
        <MediaPicker
          title="Author photo"
          onClose={() => setPicking(false)}
          onPick={(m: Media) => {
            setPhoto({ id: m.id, path: m.path });
            setPicking(false);
          }}
        />
      ) : null}
    </div>
  );
}
