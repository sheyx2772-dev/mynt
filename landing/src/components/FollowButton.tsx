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
            ? "flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 px-6 py-3 text-[11px] font-semibold tracking-[0.16em] text-white/55 uppercase transition-colors hover:bg-white/5 disabled:opacity-60"
            : "flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-6 py-3 text-[11px] font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:border-white/30 hover:bg-white/[0.09] disabled:opacity-60"
        }
      >
        {following ? (
          <>
            <UserCheck className="h-4 w-4" />
            {labels.following}
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            {labels.follow}
          </>
        )}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
