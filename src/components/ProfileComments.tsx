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
      <p className="rule pb-3 text-[16px] font-semibold tracking-[0.1em] uppercase">
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
            className="w-full resize-none rounded-lg border border-ink/15 bg-paper px-4 py-3.5 text-[16px] leading-6 text-ink outline-none placeholder:text-mute focus:border-ink"
          />
          {error && <p className="mt-1.5 text-[16px] leading-6 text-danger">{error}</p>}
          <button
            type="submit"
            disabled={pending || body.trim().length === 0}
            className="mt-2 flex h-14 items-center justify-center rounded-xl bg-paper px-5 text-[16px] font-medium text-ink shadow-deboss active:bg-ink/5"
          >
            {pending ? labels.sending : labels.send}
          </button>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="mt-3 text-[16px] leading-6 text-mute">{labels.empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {comments.map((c) => (
            <li key={c.id} className="rule py-3 last:bg-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[16px] leading-6 text-mute">
                    {c.authorHandle ? (
                      <Link
                        href={`/${c.authorHandle}`}
                        className="font-mono transition-colors hover:text-ink"
                      >
                        {c.authorHandle}
                      </Link>
                    ) : (
                      c.authorName
                    )}
                  </p>
                  <p className="mt-1 text-[16px] leading-6 break-words whitespace-pre-wrap text-ink">
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
                    className="shrink-0 text-mute transition-colors hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
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
