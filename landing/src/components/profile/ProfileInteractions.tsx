"use client";

import { useState } from "react";
import { Check, Heart, Flame, PartyPopper, Smile, UserPlus, QrCode, Share2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function ProfileInteractions({
  followersCount = 0,
  viewsCount = 0,
  raqam,
}: {
  followersCount?: number;
  viewsCount?: number;
  raqam: string;
}) {
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(followersCount || 1240);

  const [reactions, setReactions] = useState([
    { emoji: "❤️", count: 4820, active: false },
    { emoji: "🔥", count: 1940, active: false },
    { emoji: "🥳", count: 2130, active: false },
    { emoji: "😮", count: 856, active: false },
  ]);

  const toggleFollow = () => {
    if (!following) {
      setFollowers((prev) => prev + 1);
      setFollowing(true);
      toast.success("Obuna bo'lindi!");
    } else {
      setFollowers((prev) => Math.max(0, prev - 1));
      setFollowing(false);
    }
  };

  const react = (index: number) => {
    setReactions((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        return {
          ...r,
          count: r.active ? r.count - 1 : r.count + 1,
          active: !r.active,
        };
      }),
    );
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Flex — ${raqam}`,
          url: window.location.href,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Havola nusxalandi!");
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Action Buttons Row */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={toggleFollow}
          className={`flex h-10 items-center gap-1.5 rounded-full px-5 text-xs font-bold shadow-md transition-all active:scale-95 ${
            following
              ? "bg-[var(--p-surface-2)] text-[var(--p-text)] ring-1 ring-[var(--p-line)]"
              : "bg-[var(--p-accent)] text-[var(--p-on-accent)] shadow-[0_0_15px_var(--p-accent)]"
          }`}
        >
          {following ? (
            <>
              <Check className="size-3.5" strokeWidth={3} />
              <span>Obunadasiz</span>
            </>
          ) : (
            <>
              <UserPlus className="size-3.5" strokeWidth={2.5} />
              <span>Obuna</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => toast.info("Tez orada xabar yuborish imkoniyati qo'shiladi")}
          className="flex size-10 items-center justify-center rounded-full bg-[var(--p-surface)] text-[var(--p-text-2)] ring-1 ring-[var(--p-line)] transition-colors hover:text-[var(--p-text)]"
          aria-label="Xabar yozish"
        >
          <MessageCircle className="size-4" />
        </button>

        <button
          type="button"
          onClick={share}
          className="flex size-10 items-center justify-center rounded-full bg-[var(--p-surface)] text-[var(--p-text-2)] ring-1 ring-[var(--p-line)] transition-colors hover:text-[var(--p-text)]"
          aria-label="Ulashish"
        >
          <Share2 className="size-4" />
        </button>
      </div>

      {/* Stats Counters Grid */}
      <div className="grid grid-cols-3 divide-x divide-[var(--p-line)] rounded-tile bg-[var(--p-surface)] py-3 text-center shadow-inner">
        <div>
          <span className="block font-mono text-base font-bold text-[var(--p-text)]">
            {followers >= 1000 ? `${(followers / 1000).toFixed(1)}K` : followers}
          </span>
          <span className="cap mt-0.5 block text-[11px] text-[var(--p-text-3)]">
            Obunachi
          </span>
        </div>
        <div>
          <span className="block font-mono text-base font-bold text-[var(--p-text)]">
            891
          </span>
          <span className="cap mt-0.5 block text-[11px] text-[var(--p-text-3)]">
            Kuzatiladi
          </span>
        </div>
        <div>
          <span className="block font-mono text-base font-bold text-[var(--p-text)]">
            {viewsCount > 0 ? viewsCount : 340}
          </span>
          <span className="cap mt-0.5 block text-[11px] text-[var(--p-text-3)]">
            Ko'rishlar
          </span>
        </div>
      </div>

      {/* Reactions Row */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
        {reactions.map((r, i) => (
          <button
            key={i}
            type="button"
            onClick={() => react(i)}
            className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all active:scale-90 ${
              r.active
                ? "bg-[var(--p-surface-2)] text-[var(--p-text)] ring-2 ring-[var(--p-accent)] shadow-sm"
                : "bg-[var(--p-surface)] text-[var(--p-text-2)] ring-1 ring-[var(--p-line)] hover:bg-[var(--p-surface-2)]"
            }`}
          >
            <span>{r.emoji}</span>
            <span className="font-mono text-[11px]">
              {r.count >= 1000 ? `${(r.count / 1000).toFixed(1)}K` : r.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
