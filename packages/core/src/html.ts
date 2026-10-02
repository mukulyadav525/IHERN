import sanitizeHtml from "sanitize-html";

/**
 * Post content is HTML written in the blog's editor (or imported from
 * WordPress). It is cleaned when it is saved, so only ordinary formatting
 * survives - no scripts, styles, event handlers or embedded pages other than
 * video players.
 */

const ALLOWED_IFRAME_HOSTS = ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"];

export function sanitizePostHtml(html: string): string {
  const withoutBlockComments = String(html).replace(/<!--[\s\S]*?-->/g, "");
  return sanitizeHtml(withoutBlockComments, {
    allowedTags: [
      "p", "br", "hr", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "sub", "sup", "mark", "small",
      "a", "ul", "ol", "li", "blockquote", "q", "cite", "code", "pre", "figure", "figcaption", "img",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "iframe", "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: ["src", "width", "height", "title", "allow", "allowfullscreen", "frameborder"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
      ol: ["start", "reversed", "type"],
      "*": ["class", "id"],
    },
    allowedClasses: {
      "*": [/^wp-block-[\w-]+$/, /^has-[\w-]+$/, /^align[\w-]*$/, /^is-[\w-]+$/, "wp-element-caption", "size-full", "size-large", "size-medium", "size-thumbnail"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    allowedIframeHostnames: ALLOWED_IFRAME_HOSTS,
    allowProtocolRelative: false,
    // Empty paragraphs (WordPress leaves them behind) add stray gaps.
    exclusiveFilter: (frame) => frame.tag === "p" && !frame.text.trim() && !frame.mediaChildren.length,
    transformTags: {
      // External links open in a new tab without handing over the page.
      a: (tagName, attribs) => {
        const out = { ...attribs };
        if (out.target === "_blank") out.rel = "noopener noreferrer";
        return { tagName, attribs: out };
      },
      b: "strong",
      i: "em",
    },
  })
    // WordPress leaves runs of blank lines between blocks.
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Plain text with paragraphs (comments): escaped, line breaks kept. */
export function textToHtml(text: string): string {
  return String(text)
    .trim()
    .split(/\n{2,}/)
    .map((para) =>
      "<p>" +
      para
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/\n/g, "<br />") +
      "</p>"
    )
    .join("\n");
}
