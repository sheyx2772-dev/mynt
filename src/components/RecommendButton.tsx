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
            ? "flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink/[0.045] px-3 text-[16px] font-medium text-mute"
            : "flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-paper px-3 text-[16px] font-medium text-ink shadow-deboss active:bg-ink/5"
        }
      >
        <BadgeCheck className="h-5 w-5" />
        {on ? labels.recommended : labels.recommend}
        {total > 0 && <span className="tabular-nums text-mute">{total}</span>}
      </button>

      {/* Who vouched, by their own handle. A name is a claim; a handle is a
          profile the reader can open and judge. */}
      {recommenders.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[16px] leading-6 text-mute">
          <span>{labels.whoDid}</span>
          {recommenders.map((r) => (
            <Link
              key={r.handle}
              href={`/${r.handle}`}
              title={r.name}
              className="font-mono text-mute transition-colors hover:text-ink"
            >
              {r.handle}
            </Link>
          ))}
        </p>
      )}
    </div>
  );
}
