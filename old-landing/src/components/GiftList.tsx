"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { toggleGift } from "@/app/kabinet/[handle]/actions";
import type { Gift } from "@/lib/gifts";
import { timeAgo } from "@/lib/relative-time";

// The owner's shelf, with a switch on every gift.
//
// Taking one off is not un-giving it: the sender paid, the order stands, and
// putting it back is the same switch the other way.

export default function GiftList({ handle, initial }: { handle: string; initial: Gift[] }) {
  const [gifts, setGifts] = useState(initial);
  const [pending, startTransition] = useTransition();

  const flip = (gift: Gift) => {
    const shown = !gift.shown;
    setGifts((all) => all.map((g) => (g.id === gift.id ? { ...g, shown } : g)));
    startTransition(async () => {
      const ok = await toggleGift(handle, gift.id, shown);
      if (!ok) setGifts((all) => all.map((g) => (g.id === gift.id ? { ...g, shown: !shown } : g)));
    });
  };

  if (gifts.length === 0) {
    return (
      <p className="rounded-card border border-ink-line bg-ink-s1 px-5 py-6 text-center text-sm text-paper-2">
        Hozircha sovg&apos;a yo&apos;q. Profilingizdagi «Sovg&apos;a qilish» tugmasi orqali tanishlaringiz
        stiker sovg&apos;a qila oladi.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {gifts.map((g) => (
        <li
          key={g.id}
          className={`flex items-center gap-3 rounded-card border border-ink-line bg-ink-s1 px-4 py-3 ${
            g.shown ? "" : "opacity-60"
          }`}
        >
          <span className={`gift-tile gift-${g.tier} flex size-11 shrink-0 items-center justify-center rounded-plate text-2xl`} aria-hidden>
            {g.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {g.name} —{" "}
              {g.fromHandle ? (
                <Link href={`/${g.fromHandle}`} className="underline underline-offset-2">{g.from}</Link>
              ) : (
                g.from
              )}
            </p>
            <p className="truncate text-xs text-paper-3">
              {g.note ? `«${g.note}» · ` : ""}
              {timeAgo(g.at, "uz")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => flip(g)}
            disabled={pending}
            aria-label={g.shown ? "Javondan olish" : "Javonga qaytarish"}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-s2 text-paper-2"
          >
            {g.shown ? <Eye className="size-4" strokeWidth={1.8} /> : <EyeOff className="size-4" strokeWidth={1.8} />}
          </button>
        </li>
      ))}
    </ul>
  );
}
