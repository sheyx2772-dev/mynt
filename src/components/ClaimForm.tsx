"use client";

import { useActionState } from "react";
import { claimHandle, type ClaimResult } from "@/app/[handle]/actions";

const initialState: ClaimResult = { ok: false, error: "" };

export default function ClaimForm({
  letters,
  digits,
  priceLabel,
}: {
  letters: string;
  digits: string;
  priceLabel: string;
}) {
  const boundAction = claimHandle.bind(null, letters, digits);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  const inputClass =
    "w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-2.5 text-sm outline-none transition-colors focus:border-mynt-black/30 focus:bg-white";

  return (
    <form action={formAction} className="mt-8 space-y-3 text-left">
      <input name="name" placeholder="Ismingiz *" required className={inputClass} />
      <textarea name="bio" placeholder="Qisqa bio (ixtiyoriy)" rows={2} className={inputClass} />
      <div className="grid grid-cols-2 gap-3">
        <input name="telegram" placeholder="Telegram @username" className={inputClass} />
        <input name="instagram" placeholder="Instagram @username" className={inputClass} />
      </div>
      <input name="website" placeholder="Veb-sayt (ixtiyoriy)" className={inputClass} />

      {!state.ok && state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-lime px-6 py-3 font-medium text-mynt-black shadow-[0_12px_30px_-10px_rgba(171,255,9,0.65)] transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {isPending ? "Yuborilmoqda..." : `${priceLabel} — Band qilish`}
      </button>
      <p className="text-center text-xs text-mynt-black/40">
        Hozircha to&apos;lov tizimi ulanmagan — bu demo/test rejimida bepul band qilish.
      </p>
    </form>
  );
}
