"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { submitComment, removeComment } from "@/app/[handle]/actions";
import type { ProfileComment } from "@/lib/comments";

// Comments, on a card whose owner chose to have them.
//
// Written to look like the rest of the card rather than like a forum: the same
// hairline rules, the same quiet type. A comment section that looks borrowed
// from somewhere else is the fastest way to make a professional turn it off.

export default function ProfileComments({
  handle,
  comments,
  viewerId,
  ownerId,
  labels,
}: {
  handle: string;
  comments: ProfileComment[];
  /** Null when signed out. */
  viewerId: string | null;
  ownerId: string | null;
  labels: {
    title: string;
    placeholder: string;
    send: string;
    sending: string;
    empty: string;
    signIn: string;
  };
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const isOwner = Boolean(viewerId && viewerId === ownerId);
  const alreadyWrote = comments.some((c) => c.authorId === viewerId);

  return (
    <div className="mt-6">
      <p className="text-[10px] font-medium tracking-[0.18em] text-white/35 uppercase">
        {labels.title}
      </p>

      {/* The owner does not write on their own card, and nobody writes twice. */}
      {!isOwner && !alreadyWrote && (
        <form
          action={() =>
            startTransition(async () => {
              setError(null);
              const result = await submitComment(handle, body);
              if (result.needsAuth) {
                router.push(`/kirish?keyin=${encodeURIComponent(`/${handle}`)}`);
                return;
              }
              if (result.ok) {
                setBody("");
                router.refresh();
              } else {
                setError(result.error ?? "Yuborilmadi.");
              }
            })
          }
          className="mt-3"
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={labels.placeholder}
            className="w-full resize-none rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
          />
          {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={pending || body.trim().length === 0}
            className="mt-2 rounded-xl border border-white/12 bg-white/[0.05] px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:border-white/30 disabled:opacity-40"
          >
            {pending ? labels.sending : labels.send}
          </button>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="mt-3 text-sm text-white/35">{labels.empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/[0.07]">
          {comments.map((c) => (
            <li key={c.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-white/45">
                    {c.authorHandle ? (
                      <Link
                        href={`/${c.authorHandle}`}
                        className="font-tabular transition-colors hover:text-white/80"
                      >
                        {c.authorHandle}
                      </Link>
                    ) : (
                      c.authorName
                    )}
                  </p>
                  <p className="mt-1 text-sm break-words whitespace-pre-wrap text-white/80">
                    {c.body}
                  </p>
                </div>

                {/* The author may take theirs back; the owner may take any. */}
                {(c.authorId === viewerId || isOwner) && (
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await removeComment(handle, c.id);
                        router.refresh();
                      })
                    }
                    aria-label="O'chirish"
                    className="shrink-0 text-white/25 transition-colors hover:text-white/60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
