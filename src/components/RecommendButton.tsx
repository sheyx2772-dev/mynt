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
            ? "flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-line bg-fill px-5 text-[16px] font-semibold text-ink-2 disabled:text-ink-3"
            : "flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-line-2 bg-white px-5 text-[16px] font-semibold text-ink transition-transform duration-[120ms] active:scale-[0.98] active:bg-fill disabled:text-ink-3"
        }
      >
        <BadgeCheck className="h-5 w-5" />
        {on ? labels.recommended : labels.recommend}
        {total > 0 && <span className="num text-ink-3">{total}</span>}
      </button>

      {/* Who vouched, by their own handle. A name is a claim; a handle is a
          profile the reader can open and judge. */}
      {recommenders.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-[18px] text-ink-3">
          <span>{labels.whoDid}</span>
          {recommenders.map((r) => (
            <Link
              key={r.handle}
              href={`/${r.handle}`}
              title={r.name}
              className="num text-ink-2 transition-colors hover:text-ink"
            >
              {r.handle}
            </Link>
          ))}
        </p>
      )}
    </div>
  );
}
