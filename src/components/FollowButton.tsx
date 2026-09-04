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
            ? "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink/[0.045] px-3 py-2 text-[16px] leading-5 font-medium text-balance text-mute"
            : "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-paper px-3 py-2 text-[16px] leading-5 font-medium text-balance text-ink shadow-deboss active:bg-ink/5"
        }
      >
        {following ? (
          <>
            <UserCheck className="size-5 shrink-0" />
            {labels.following}
          </>
        ) : (
          <>
            <UserPlus className="size-5 shrink-0" />
            {labels.follow}
          </>
        )}
      </button>
      {error && <p className="mt-2 text-center text-[16px] leading-6 text-danger">{error}</p>}
    </div>
  );
}
