"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { toggleRecommend } from "@/app/[handle]/actions";

// One tap. No stars, no average, no form.
//
// Only the control lives here. Who vouched is a list of handles and belongs on
// the page, under the row — a button that also carries a paragraph cannot sit
// beside another button, and these two are a pair.
//
// The count only appears once somebody has tapped: a card opening with "0
// recommendations" beside a person's name is worse than one that says nothing,
// the same reason the follower counts are hidden at zero.

export default function RecommendButton({
  handle,
  count,
  recommended,
  labels,
}: {
  handle: string;
  count: number;
  recommended: boolean;
  labels: { recommend: string; recommended: string };
}) {
  const [on, setOn] = useState(recommended);
  const [total, setTotal] = useState(count);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
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
            ? "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink/[0.045] px-3 py-2 text-[16px] leading-5 font-medium text-balance text-mute"
            : "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-paper px-3 py-2 text-[16px] leading-5 font-medium text-balance text-ink shadow-deboss active:bg-ink/5"
        }
      >
        <BadgeCheck className="size-5 shrink-0" />
        {on ? labels.recommended : labels.recommend}
      {total > 0 && <span className="tabular-nums text-mute">{total}</span>}
    </button>
  );
}
