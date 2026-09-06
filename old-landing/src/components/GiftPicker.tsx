"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { startGift } from "@/app/[handle]/actions";
import type { Sticker } from "@/lib/gifts";
import { formatUZS } from "@/lib/format";

// Choosing what to give.
//
// A grid of nine, the price under each, one line to go with it, and the
// payment choice only after the order exists — the same order of events as
// buying a number, because the buyer already knows that one.

export default function GiftPicker({
  handle,
  name,
  stickers,
  signedIn,
}: {
  handle: string;
  name: string;
  stickers: Sticker[];
  signedIn: boolean;
}) {
  const [chosen, setChosen] = useState<Sticker | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{ click?: string; payme?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    if (!chosen) return;
    setError(null);
    startTransition(async () => {
      const result = await startGift(handle, chosen.id, note.trim());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.paid) {
        router.push(`/${handle}?sovga=1`);
        return;
      }
      setCheckout(result.checkout);
    });
  };

  if (checkout && chosen) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-paper-2">
          {chosen.emoji} {chosen.name} — {name} uchun. To&apos;lovni yakunlang:
        </p>
        {checkout.click && (
          <a href={checkout.click} className="block rounded-full bg-paper px-6 py-3 text-center font-medium text-ink">
            Click orqali to&apos;lash — {formatUZS(chosen.price)}
          </a>
        )}
        {checkout.payme && (
          <a href={checkout.payme} className="block rounded-full bg-lime px-6 py-3 text-center font-medium text-ink">
            Payme orqali to&apos;lash — {formatUZS(chosen.price)}
          </a>
        )}
        <p className="text-center text-xs text-paper-3">
          To&apos;lov tasdiqlangach sovg&apos;a profilda ko&apos;rinadi va egasiga xabar boradi.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Stiker">
        {stickers.map((s) => {
          const on = chosen?.id === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setChosen(s)}
                className={`gift-tile gift-${s.tier} flex w-full flex-col items-center gap-1 rounded-card border-2 px-2 py-3 transition-transform active:scale-[0.97] ${
                  on ? "border-lime" : "border-transparent"
                }`}
              >
                <span className="text-3xl leading-none" aria-hidden>{s.emoji}</span>
                <span className="text-xs font-medium text-ink">{s.name}</span>
                <span className="font-tabular text-[11px] text-ink/70">{formatUZS(s.price)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={140}
        placeholder="Bir og'iz so'z (ixtiyoriy)"
        className="mt-4 h-11 w-full rounded-input border border-ink-line bg-ink-s2 px-4 text-sm outline-none focus:border-paper-3"
      />

      {!signedIn ? (
        <Link
          href={`/kirish?next=/${handle}/sovga`}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-lime font-medium text-ink"
        >
          Sovg&apos;a qilish uchun kiring
        </Link>
      ) : (
        <button
          type="button"
          onClick={submit}
          disabled={!chosen || pending}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-lime font-medium text-ink disabled:opacity-50"
        >
          {chosen ? `${chosen.emoji} Sovg'a qilish — ${formatUZS(chosen.price)}` : "Stikerni tanlang"}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-danger-ink">{error}</p>}
    </div>
  );
}
