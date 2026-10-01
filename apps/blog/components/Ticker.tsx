"use client";

import Link from "next/link";
import { useState } from "react";
import { mediaPath } from "@ihern/core/blog-paths";
import { u } from "@/lib/paths";

export type TickerItem = { href: string; title: string; date: string; image: string | null };

/**
 * "Recent Blogs": the latest posts scrolling across the top of the front
 * page, with a pause button. Respects reduced motion (it does not move).
 */
export default function Ticker({ items }: { items: TickerItem[] }) {
  const [paused, setPaused] = useState(false);
  if (!items.length) return null;
  const loop = [...items, ...items];
  return (
    <section className="b-ticker" aria-label="Recent blogs">
      <span className="b-ticker-label">
        <span className="b-ticker-dot" aria-hidden="true"></span>
        Recent Blogs
      </span>
      <div className="b-ticker-track">
        <ul className={`b-ticker-list${paused ? " is-paused" : ""}`} style={{ animationDuration: `${Math.max(20, items.length * 9)}s` }}>
          {loop.map((it, i) => (
            <li key={i} aria-hidden={i >= items.length ? true : undefined}>
              <Link href={it.href} tabIndex={i >= items.length ? -1 : undefined}>
                {it.image ? <img src={u(mediaPath(it.image, 96))} alt="" width={28} height={28} loading="lazy" /> : null}
                <span className="b-ticker-title">{it.title}</span>
                {it.date ? <span className="b-ticker-date">{it.date}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <button type="button" className="b-ticker-pause" aria-pressed={paused} aria-label={paused ? "Play" : "Pause"} onClick={() => setPaused((p) => !p)}>
        {paused ? (
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
        )}
      </button>
    </section>
  );
}
