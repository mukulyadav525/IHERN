"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content";
import { addComment, getPostById, listEditors } from "@ihern/core/blog";
import { setSubscribed } from "@ihern/core/store";
import { sendCommentForModeration } from "@ihern/core/mail";
import { blogUrl } from "@ihern/core/env";
import { readReader } from "@/lib/session";

/** What signed-in readers can do on the blog: subscribe, unsubscribe, comment. */

export type SubscribeState = { subscribed: boolean; message: string; error: string };

export async function toggleSubscription(prev: SubscribeState, form: FormData): Promise<SubscribeState> {
  const reader = await readReader();
  if (!reader) return { ...prev, message: "", error: "Please sign in again." };
  const subscribe = form.get("action") === "subscribe";
  const res = await setSubscribed(reader.subscriberId, subscribe, "blog");
  if (!res.ok) return { ...prev, message: "", error: "Your subscription could not be saved just now. Please try again." };
  revalidatePath("/", "layout");
  return {
    subscribed: subscribe,
    error: "",
    message: subscribe ? "You are subscribed. New posts will reach you by email." : "You have been unsubscribed from the IHERN Blog.",
  };
}

export type CommentState = { status: "" | "approved" | "pending"; error: string; draft: string; seq: number };

const MAX_COMMENT = 5000;

export async function postComment(prev: CommentState, form: FormData): Promise<CommentState> {
  const reader = await readReader();
  const content = String(form.get("comment") ?? "").replace(/\r\n/g, "\n").trim();
  const postId = Number(form.get("post_id"));
  const fail = (error: string): CommentState => ({ status: "", error, draft: content, seq: prev.seq });

  if (!reader) return fail("Please sign in to comment.");
  if (!content) return fail("Please write a comment first.");
  if (content.length > MAX_COMMENT) return fail(`Comments can be up to ${MAX_COMMENT} characters.`);

  const post = Number.isInteger(postId) ? await getPostById(postId) : undefined;
  if (!post || post.status !== "published" || !post.commentsOpen) return fail("Comments are closed on this post.");

  const status = await addComment({ postId, subscriberId: reader.subscriberId, name: reader.name || reader.email.split("@")[0], email: reader.email, content });
  if (!status) return fail("Your comment could not be saved just now. Please try again.");

  if (status === "pending") {
    const editors = ((await listEditors()) ?? []).filter((e) => e.active);
    await sendCommentForModeration(editors.map((e) => e.email), post.title, reader.name || reader.email, content, `${blogUrl()}/admin/comments`);
  }
  if (status === "approved") revalidateTag(CONTENT_TAG); // the cached comment list
  revalidatePath(`/posts/${post.slug}`);
  return { status, error: "", draft: "", seq: prev.seq + 1 };
}
