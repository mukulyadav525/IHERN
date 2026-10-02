import { blogUrl } from "./env";

/**
 * Addresses of blog posts and uploaded files. No database access, so these
 * are safe to import from client components.
 */

export type PostType = "post" | "page";

/** The widths the blog makes smaller copies of uploaded images at. */
export const IMAGE_WIDTHS = [96, 320, 640, 960, 1280, 1600] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

/**
 * The public address of an uploaded file, as WordPress served it; with a
 * width, the address of a copy that wide (never wider than the original).
 */
export function mediaPath(path: string, width?: ImageWidth): string {
  return "/wp-content/uploads/" + path.split("/").map(encodeURIComponent).join("/") + (width ? `?w=${width}` : "");
}

export function mediaUrl(path: string, width?: ImageWidth): string {
  return blogUrl() + mediaPath(path, width);
}

/**
 * A srcset of the given widths, leaving out widths larger than the original
 * (originalWidth from the media record; unknown = all of them). `address`
 * makes each URL (add a base path or host there).
 */
export function mediaSrcSet(path: string, originalWidth: number | null, widths: ImageWidth[], address: (p: string) => string = (p) => p): string {
  const usable = widths.filter((w) => !originalWidth || w <= originalWidth);
  return (usable.length ? usable : widths.slice(0, 1)).map((w) => `${address(mediaPath(path, w))} ${w}w`).join(", ");
}

/** The public address of a post on the blog. */
export function postPath(post: { type: PostType; slug: string }): string {
  return post.type === "page" ? `/${post.slug}` : `/posts/${post.slug}`;
}

export function postUrl(post: { type: PostType; slug: string }): string {
  return blogUrl() + postPath(post);
}
