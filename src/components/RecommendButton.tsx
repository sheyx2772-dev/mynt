"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { toggleRecommend } from "@/app/[handle]/actions";
import type { Recommender } from "@/lib/recommendations";

// One tap. No stars, no average, no form.
//
// The count only appears once somebody has tapped: a card opening with "0
// recommendations" beside a person's name is worse than one that says nothing,
// the same reason the follower counts are hidden at zero.

export default function RecommendButton({
  handle,
  count,
  recommended,
  recommenders,
  labels,
}: {
  handle: string;
  count: number;
  recommended: boolean;
  recommenders: Recommender[];
  labels: { recommend: string; recommended: string; whoDid: string };
}) {
  const [on, setOn] = useState(recommended);
  const [total, setTotal] = useState(count);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mt-3">
      <button
        onClick={() =>
          startTransition(async () => {
            const result = await toggleRecommend(handle);
            if (!result.ok) {
              if (result.needsAuth) {
                router.push(`/kirish?keyin=${encodeURIComponent(`/${handle}`)}`);
              }
              return;
            }
            setOn(result.recommended);
            setTotal((n) => n + (result.recommended ? 1 : -1));
            router.refresh();
          })
        }
        disabled={pending}
        className={
          on
            ? "flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--accent)]/50 bg-[color:var(--accent)]/10 px-6 py-3.5 text-[11px] font-semibold tracking-[0.16em] text-[color:var(--accent)] uppercase disabled:opacity-50"
            : "flex w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-6 py-3.5 text-[11px] font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:border-white/30 disabled:opacity-50"
        }
      >
        <BadgeCheck className="h-4 w-4" />
        {on ? labels.recommended : labels.recommend}
        {total > 0 && <span className="font-tabular opacity-60">{total}</span>}
      </button>

      {/* Who vouched, by their own handle. A name is a claim; a handle is a
          profile the reader can open and judge. */}
      {recommenders.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/35">
          <span className="tracking-[0.14em] uppercase">{labels.whoDid}</span>
          {recommenders.map((r) => (
            <Link
              key={r.handle}
              href={`/${r.handle}`}
              title={r.name}
              className="font-tabular transition-colors hover:text-white/70"
            >
              {r.handle}
            </Link>
          ))}
        </p>
      )}
    </div>
  );
}
