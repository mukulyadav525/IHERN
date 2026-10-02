"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { postComment, type CommentState } from "@/app/actions/reader";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="b-btn" disabled={pending}>
      {pending ? "Posting…" : "Post Comment"}
    </button>
  );
}

/** "Leave a reply", for signed-in readers. */
export default function CommentForm({ postId, name }: { postId: number; name: string }) {
  const [state, action] = useActionState(postComment, { status: "", error: "", draft: "", seq: 0 } as CommentState);
  return (
    <form action={action} className="b-comment-form" key={state.seq}>
      <h3 className="b-comment-form-title">Leave a Reply</h3>
      <p className="b-comment-as">Commenting as <strong>{name}</strong>.</p>
      {state.status === "pending" ? <p className="b-form-ok" role="status">Thank you. Your comment is awaiting approval and will appear once an editor has seen it.</p> : null}
      {state.status === "approved" ? <p className="b-form-ok" role="status">Your comment has been published.</p> : null}
      {state.error ? <p className="b-form-error" role="alert">{state.error}</p> : null}
      <input type="hidden" name="post_id" value={postId} />
      <label className="ihern-visually-hidden" htmlFor="comment">Comment</label>
      <textarea id="comment" name="comment" rows={6} maxLength={5000} required placeholder="Write a comment…" defaultValue={state.draft} />
      <Submit />
    </form>
  );
}
