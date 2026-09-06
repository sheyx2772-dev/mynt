"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/app/kabinet/[handle]/actions";

// Deleting a post asked nothing and reported nothing.
//
// It was a 16px icon that removed the post on the first tap — on a phone, next
// to the post's own body, which is exactly where a thumb lands while
// scrolling. And the call was `void deletePost(...)`, so a delete that failed
// looked identical to one that worked: the post stayed, and the owner tapped
// again.
//
// Two taps now, with the second one saying what it does, and the result is
// read. The shape follows ReleaseHandleButton, which is the pattern this
// codebase already settled on for destructive things.
export default function DeletePostButton({ postId }: { postId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        aria-label="Postni o'chirish"
        className="grid size-11 place-items-center rounded-plate text-paper-3 transition-colors hover:text-danger-ink"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {error && <p className="text-xs text-danger-ink">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            startTransition(async () => {
              const result = await deletePost(postId);
              if (result && !result.ok) {
                setError(result.error ?? "O'chirilmadi. Qaytadan urinib ko'ring.");
                setConfirming(false);
              }
            })
          }
          disabled={pending}
          className="min-h-11 rounded-plate bg-danger-ink/15 px-3.5 text-xs font-medium text-danger-ink disabled:opacity-50"
        >
          {pending ? "O'chirilmoqda…" : "O'chirish"}
        </button>
        <button
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className="min-h-11 rounded-plate border border-ink-line px-3.5 text-xs font-medium"
        >
          Bekor qilish
        </button>
      </div>
    </div>
  );
}
