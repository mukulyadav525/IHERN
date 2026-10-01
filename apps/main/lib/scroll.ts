/**
 * Scrolls the window to `target` over a fixed duration with jQuery's default
 * "swing" easing - what the PHP pages' $('html, body').animate() did - so a
 * long jump takes the same time as a short one. Jumps straight there when the
 * reader prefers reduced motion. Client-side only.
 *
 * `target` may be a function: it is measured again on every frame, so a
 * section still lands at the top when images above it load during the scroll
 * and push it down the page.
 */
export function animateScroll(target: number | (() => number), duration: number, done?: () => void): void {
  const where = typeof target === "function" ? target : () => target;
  const start = window.scrollY;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(where() - start) < 2) {
    window.scrollTo(0, where());
    done?.();
    return;
  }
  const t0 = performance.now();
  const swing = (p: number) => 0.5 - Math.cos(p * Math.PI) / 2;
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / duration);
    window.scrollTo(0, start + (where() - start) * swing(p));
    if (p < 1) requestAnimationFrame(step);
    else done?.();
  };
  requestAnimationFrame(step);
}
