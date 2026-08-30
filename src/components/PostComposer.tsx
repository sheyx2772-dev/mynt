"use client";

import { useActionState } from "react";
import { createPost, type PostResult } from "@/app/kabinet/[handle]/actions";
import { MAX_POST_LENGTH } from "@/lib/post-limits";

const initialState: PostResult = { ok: false };

export default function PostComposer({ handle }: { handle: string }) {
  const boundAction = createPost.bind(null, handle);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <textarea
        name="body"
        rows={3}
        required
        maxLength={MAX_POST_LENGTH}
        placeholder="Nima yangilik?"
        className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm outline-none transition-colors focus:border-mynt-black/30 focus:bg-white"
      />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-mynt-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mynt-black/85 disabled:opacity-60"
      >
        {isPending ? "Yuborilmoqda..." : "Joylash"}
      </button>
    </form>
  );
}
