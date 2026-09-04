"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toggleFollow } from "@/app/[handle]/actions";

export default function FollowButton({
  handle,
  initialFollowing,
  labels,
}: {
  handle: string;
  initialFollowing: boolean;
  labels: { follow: string; following: string };
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await toggleFollow(handle);

      if (result.needsAuth) {
        router.push(`/kirish?keyin=${encodeURIComponent(`/${handle}`)}`);
        return;
      }
      if (result.error) {
        setError(result.error);
        return;
      }
      // The server decides the resulting state, not this component.
      setFollowing(result.following);
    });
  }

  return (
    <div>
      <button
        onClick={onClick}
        disabled={pending}
        className={
          following
            ? "flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-line bg-fill px-5 text-[16px] font-semibold text-ink-2 disabled:text-ink-3"
            : "flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-line-2 bg-white px-5 text-[16px] font-semibold text-ink transition-transform duration-[120ms] active:scale-[0.98] active:bg-fill disabled:text-ink-3"
        }
      >
        {following ? (
          <>
            <UserCheck className="h-5 w-5" />
            {labels.following}
          </>
        ) : (
          <>
            <UserPlus className="h-5 w-5" />
            {labels.follow}
          </>
        )}
      </button>
      {error && <p className="mt-2 text-center text-[13px] leading-[18px] text-danger">{error}</p>}
    </div>
  );
}
