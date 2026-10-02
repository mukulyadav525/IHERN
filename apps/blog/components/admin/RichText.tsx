"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import MediaPicker from "./MediaPicker";
import { mediaPath } from "@ihern/core/blog-paths";

/**
 * The post text editor: a visual editor for everyday writing (headings, bold,
 * italic, links, lists, quotes, images), and an HTML view for anything
 * else. Content the visual editor cannot hold (tables, embedded videos,
 * subscript ...) opens in the HTML view so it is never dropped silently.
 */

const VISUAL_TAGS = new Set(["p", "br", "hr", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "img", "code", "pre"]);

export function needsHtmlMode(html: string): boolean {
  const tags = html.match(/<([a-z][a-z0-9]*)\b/gi) ?? [];
  return tags.some((t) => !VISUAL_TAGS.has(t.slice(1).toLowerCase()));
}

function Btn({ on, active, label, title, disabled }: { on: () => void; active?: boolean; label: string; title: string; disabled?: boolean }) {
  return (
    <button type="button" className={`adm-tb${active ? " is-on" : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={on} title={title} aria-label={title} aria-pressed={active} disabled={disabled}>
      {label}
    </button>
  );
}

export default function RichText({ name, initial }: { name: string; initial: string }) {
  const [html, setHtml] = useState(initial);
  const [mode, setMode] = useState<"visual" | "html">(needsHtmlMode(initial) ? "html" : "visual");
  const [picking, setPicking] = useState(false);
  const [, force] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true, defaultProtocol: "https" } }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: "Write the post…" }),
    ],
    content: mode === "visual" ? initial : "",
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    onSelectionUpdate: () => force((n) => n + 1),
  });

  // Moving between the two views carries the text across.
  useEffect(() => {
    if (!editor) return;
    if (mode === "visual") editor.commands.setContent(html, { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, editor]);

  const setLink = () => {
    if (!editor) return;
    const prev = (editor.getAttributes("link").href as string) || "";
    const url = window.prompt("Link address (leave empty to remove the link)", prev);
    if (url === null) return;
    if (!url.trim()) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const switchTo = (next: "visual" | "html") => {
    if (next === mode) return;
    if (next === "visual" && needsHtmlMode(html) && !window.confirm("This text contains formatting the visual editor cannot keep (for example a table or an embedded video). Switching may remove it. Continue?")) return;
    setMode(next);
  };

  return (
    <div className="adm-rt">
      <div className="adm-rt-bar" role="toolbar" aria-label="Formatting">
        <span className="adm-rt-modes">
          <button type="button" className={`adm-tb${mode === "visual" ? " is-on" : ""}`} onClick={() => switchTo("visual")}>Visual</button>
          <button type="button" className={`adm-tb${mode === "html" ? " is-on" : ""}`} onClick={() => switchTo("html")}>HTML</button>
        </span>
        {mode === "visual" && editor ? (
          <>
            <Btn on={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} label="¶" title="Paragraph" />
            <Btn on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} label="H2" title="Heading" />
            <Btn on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} label="H3" title="Subheading" />
            <span className="adm-tb-sep" />
            <Btn on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="B" title="Bold" />
            <Btn on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="I" title="Italic" />
            <Btn on={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} label="U" title="Underline" />
            <Btn on={setLink} active={editor.isActive("link")} label="Link" title="Add or edit a link" />
            <span className="adm-tb-sep" />
            <Btn on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} label="• List" title="Bulleted list" />
            <Btn on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} label="1. List" title="Numbered list" />
            <Btn on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} label="Quote" title="Quotation" />
            <Btn on={() => editor.chain().focus().setHorizontalRule().run()} label="—" title="Divider line" />
            <Btn on={() => setPicking(true)} label="Image" title="Insert an image" />
            <span className="adm-tb-sep" />
            <Btn on={() => editor.chain().focus().undo().run()} label="Undo" title="Undo" disabled={!editor.can().undo()} />
            <Btn on={() => editor.chain().focus().redo().run()} label="Redo" title="Redo" disabled={!editor.can().redo()} />
          </>
        ) : null}
      </div>
      {mode === "visual" ? (
        <EditorContent editor={editor} className="adm-rt-body b-content" />
      ) : (
        <textarea className="adm-rt-html" value={html} onChange={(e) => setHtml(e.target.value)} rows={24} spellCheck={false} aria-label="Post text (HTML)" />
      )}
      <input type="hidden" name={name} value={html} />
      {picking ? (
        <MediaPicker
          title="Insert an image"
          onClose={() => setPicking(false)}
          onPick={(m) => {
            setPicking(false);
            editor?.chain().focus().setImage({ src: mediaPath(m.path), alt: m.alt || "" }).run();
          }}
        />
      ) : null}
    </div>
  );
}
