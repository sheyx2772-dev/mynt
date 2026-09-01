"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toggleFollow } from "@/app/[handle]/actions";

export default function FollowButton({
  handle,
  initialFollowing,
  // Beside the save-contact button the label does not fit, so the icon carries
  // it. The accessible name stays on the button either way.
  compact = false,
}: {
  handle: string;
  initialFollowing: boolean;
  compact?: boolean;
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

  const label = following ? "Obuna bo'lingan" : "Obuna bo'lish";

  if (compact) {
    return (
      <button
        onClick={onClick}
        disabled={pending}
        aria-label={label}
        title={label}
        className={
          following
            ? "flex h-[46px] w-[46px] items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:bg-white/5 disabled:opacity-60"
            : "flex h-[46px] w-[46px] items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-white transition-colors hover:bg-white/[0.12] disabled:opacity-60"
        }
      >
        {following ? <UserCheck className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={onClick}
        disabled={pending}
        className={
          following
            ? "flex w-full items-center justify-center gap-1.5 rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 disabled:opacity-60"
            : "flex w-full items-center justify-center gap-1.5 rounded-full bg-lime px-6 py-2.5 text-sm font-medium text-flex-black transition-transform hover:scale-[1.01] disabled:opacity-60"
        }
      >
        {following ? (
          <>
            <UserCheck className="h-4 w-4" />
            Obuna bo&apos;lingan
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Obuna bo&apos;lish
          </>
        )}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
