"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { mediaPath, mediaSrcSet } from "@ihern/core/blog-paths";
import { u } from "@/lib/paths";

export type Slide = {
  href: string;
  title: string;
  excerpt: string;
  author: string;
  authorHref: string | null;
  date: string;
  image: { path: string; width: number | null; height: number | null } | null;
  categories: { slug: string; name: string }[];
};

/**
 * The featured posts at the top of the front page, one at a time, with
 * previous/next buttons. Moves on by itself every eight seconds unless the
 * reader is interacting with it or prefers reduced motion.
 */
export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const n = slides.length;

  useEffect(() => {
    if (n < 2 || hold || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 8000);
    return () => clearInterval(t);
  }, [n, hold]);

  if (!n) return null;
  const s = slides[i];
  return (
    <section
      className="b-card b-hero"
      aria-roledescription="carousel"
      aria-label="Featured posts"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <div className="b-hero-slide" aria-roledescription="slide" aria-label={`${i + 1} of ${n}`} aria-live={hold ? "polite" : "off"}>
        <Link className={`b-thumb b-hero-thumb${s.image ? "" : " b-thumb--empty"}`} href={s.href} tabIndex={-1} aria-hidden="true">
          {s.image ? (
            <img
              src={u(mediaPath(s.image.path, 960))}
              srcSet={mediaSrcSet(s.image.path, s.image.width, [640, 960, 1280], u)}
              sizes="(max-width: 767px) calc(100vw - 60px), 480px"
              alt=""
              width={s.image.width ?? undefined}
              height={s.image.height ?? undefined}
            />
          ) : null}
        </Link>
        <div className="b-hero-body">
          {s.categories.length ? (
            <div className="b-chips">
              {s.categories.map((c) => (
                <Link key={c.slug} className="b-chip" href={`/category/${c.slug}`}>
                  {c.name}
                </Link>
              ))}
            </div>
          ) : null}
          <h2 className="b-title b-title--hero">
            <Link href={s.href}>{s.title}</Link>
          </h2>
          <p className="b-excerpt">{s.excerpt}</p>
          <div className="b-meta">
            {s.authorHref ? (
              <Link className="b-meta-author" href={s.authorHref}>
                <span className="b-author-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" /></svg>
                </span>
                {s.author}
              </Link>
            ) : null}
            {s.date ? <span className="b-meta-date">{s.date}</span> : null}
          </div>
        </div>
      </div>
      {n > 1 ? (
        <>
          <button type="button" className="b-hero-nav b-hero-prev" aria-label="Previous post" onClick={() => setI((x) => (x - 1 + n) % n)}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z" /></svg>
          </button>
          <button type="button" className="b-hero-nav b-hero-next" aria-label="Next post" onClick={() => setI((x) => (x + 1) % n)}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z" /></svg>
          </button>
          <div className="b-hero-dots" role="group" aria-label="Choose a post">
            {slides.map((_, k) => (
              <button key={k} type="button" aria-label={`Post ${k + 1}`} aria-current={k === i ? "true" : undefined} onClick={() => setI(k)} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
