"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, X, UserRound } from "lucide-react";

import { decideRequest } from "@/app/kabinet/[handle]/actions";
import type { FollowRequest } from "@/lib/follow-requests";
import { timeAgo } from "@/lib/relative-time";

// The owner's inbox for a closed profile: who asked, and two answers.
//
// A row leaves the list the moment an answer is sent, before the server
// confirms it — the owner has decided, and watching the row sit there while
// the network catches up would invite a second tap. If the server disagrees
// (the request was already answered from another device), the row comes back
// with the reason, which is the honest version of "nothing happened".
export default function FollowRequestList({
  handle,
  initial,
  emptyMessage,
}: {
  handle: string;
  initial: FollowRequest[];
  emptyMessage: string;
}) {
  const [rows, setRows] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  function answer(r: FollowRequest, accept: boolean) {
    setRows((list) => list.filter((x) => x.userId !== r.userId));
    setErrors((e) => ({ ...e, [r.userId]: "" }));
    startTransition(async () => {
      const result = await decideRequest(handle, r.userId, accept);
      if (!result.ok) {
        setRows((list) => (list.some((x) => x.userId === r.userId) ? list : [r, ...list]));
        setErrors((e) => ({ ...e, [r.userId]: result.error ?? "Xatolik." }));
      }
    });
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-tile border border-ink-line bg-ink-s1 p-6 sm:p-8 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-input bg-ink-s2">
          <UserRound className="h-4 w-4 text-paper-3" />
        </span>
        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-paper-2">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => {
        const who = r.name || r.handle || "Raqamsiz foydalanuvchi";
        return (
          <li key={r.userId} className="rounded-card border border-ink-line bg-ink-s1 px-5 py-4">
            <div className="flex items-center gap-3">
              {r.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- R2 URL
                <img src={r.avatarUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-s2 text-paper-3">
                  <UserRound className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                {/* A number is a page the owner can open and judge; a bare
                    name is a claim. The link goes where there is one. */}
                {r.handle ? (
                  <Link href={`/${r.handle}`} className="block truncate text-sm font-medium text-paper hover:underline">
                    {who} <span className="font-mono text-paper-3">{r.handle}</span>
                  </Link>
                ) : (
                  <p className="truncate text-sm font-medium text-paper">{who}</p>
                )}
                <p className="text-xs text-paper-3">{timeAgo(r.askedAt, "uz")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => answer(r, false)}
                  aria-label="Rad etish"
                  className="grid size-11 place-items-center rounded-input border border-ink-line text-paper-2 transition-colors hover:text-danger-ink"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => answer(r, true)}
                  className="inline-flex h-11 items-center gap-1.5 rounded-input bg-lime px-4 text-sm font-semibold text-on-accent"
                >
                  <Check className="h-4 w-4" />
                  Qabul
                </button>
              </div>
            </div>
            {errors[r.userId] && <p className="mt-2 text-xs text-danger-ink">{errors[r.userId]}</p>}
          </li>
        );
      })}
    </ul>
  );
}
