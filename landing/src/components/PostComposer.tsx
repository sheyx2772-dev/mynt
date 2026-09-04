"use client";

import { useActionState, useState } from "react";
import { Send } from "lucide-react";

import { createPost, type PostResult } from "@/app/kabinet/[handle]/actions";
import { MAX_POST_LENGTH } from "@/lib/post-limits";

// Writing one.
//
// The counter only appears once somebody is close to the ceiling. A number
// ticking from 0/280 while you write is a limit announcing itself before it is
// anybody's problem; at forty characters left it becomes information.

const WARN_AT = 40;

const initialState: PostResult = { ok: false };

export default function PostComposer({ handle }: { handle: string }) {
  const boundAction = createPost.bind(null, handle);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const [used, setUsed] = useState(0);

  const left = MAX_POST_LENGTH - used;

  return (
    <form
      action={formAction}
      className="rounded-[1.5rem] border border-black/6 bg-white p-5 transition-shadow duration-300 focus-within:shadow-[0_6px_20px_-8px_rgba(14,10,27,0.18)]"
    >
      <textarea
        name="body"
        rows={3}
        required
        maxLength={MAX_POST_LENGTH}
        onChange={(event) => setUsed(event.target.value.length)}
        placeholder="Nima yangilik?"
        className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-flex-black/25"
      />

      {state.error && <p className="mt-2 text-[13px] text-red-700">{state.error}</p>}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-black/6 pt-3">
        <span
          className={
            left <= WARN_AT
              ? "font-tabular text-[12px] text-amber-700"
              : "font-tabular text-[12px] text-transparent select-none"
          }
          aria-hidden={left > WARN_AT}
        >
          {left}
        </span>

        <button
          type="submit"
          disabled={isPending || used === 0}
          className="flex items-center gap-1.5 rounded-xl bg-flex-black px-4 py-2 text-[13px] font-semibold text-white shadow-[0_6px_18px_-8px_rgba(14,10,27,0.7)] transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-25 disabled:shadow-none"
        >
          <Send className="h-3.5 w-3.5" />
          {isPending ? "Yuborilmoqda…" : "Joylash"}
        </button>
      </div>
    </form>
  );
}
