"use client";

import Link from "next/link";
import { useActionState } from "react";
import { claimHandle, type ClaimResult } from "@/app/[handle]/actions";

const initialState: ClaimResult = { ok: false, error: "" };

export default function ClaimForm({
  handle,
  priceLabel,
  isSignedIn,
  paymentEnabled,
}: {
  handle: string;
  priceLabel: string;
  isSignedIn: boolean;
  paymentEnabled: boolean;
}) {
  const boundAction = claimHandle.bind(null, handle);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  // Redraw what was typed after a failed submit; see ClaimValues.
  const typed = state.ok ? undefined : state.values;

  const inputClass =
    "w-full rounded-xl border border-line bg-black/[0.02] px-4 py-2.5 text-sm outline-none transition-colors focus:border-line-lead focus:bg-white";

  if (!isSignedIn) {
    return (
      <div className="mt-8">
        <Link
          href={`/kirish?keyin=${encodeURIComponent(`/${handle}`)}`}
          className="block w-full rounded-full bg-lime px-6 py-3 text-center font-medium text-flex-black transition-transform hover:scale-[1.01]"
        >
          Kirib, band qilish
        </Link>
        <p className="mt-3 text-center text-xs text-ink-3">
          Handle sizga biriktirilishi uchun hisob kerak.
        </p>
      </div>
    );
  }

  // The order exists and the handle is held; the buyer now picks a provider.
  if (state.ok && state.checkout) {
    return (
      <div className="mt-8 space-y-3">
        <p className="text-sm text-ink-2">
          <span className="font-medium text-flex-black">{handle}</span> siz uchun 30 daqiqaga
          band qilindi. To&apos;lovni yakunlang:
        </p>
        {/* Said here rather than saved for later: the buyer is about to leave
            for a payment page, and this is the last moment they are looking. */}
        {state.imageFailed && (
          <p className="text-sm text-amber-700">
            Rasm yuklanmadi — to&apos;lovdan keyin kabinetdan qo&apos;shasiz.
          </p>
        )}
        {state.checkout.click && (
          <a
            href={state.checkout.click}
            className="block rounded-full bg-flex-black px-6 py-3 text-center font-medium text-white transition-transform hover:scale-[1.01]"
          >
            Click orqali to&apos;lash — {priceLabel}
          </a>
        )}
        {state.checkout.payme && (
          <a
            href={state.checkout.payme}
            className="block rounded-full bg-lime px-6 py-3 text-center font-medium text-flex-black transition-transform hover:scale-[1.01]"
          >
            Payme orqali to&apos;lash — {priceLabel}
          </a>
        )}
        <p className="text-center text-xs text-ink-3">
          To&apos;lov tasdiqlangach handle butunlay sizniki bo&apos;ladi.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-3 text-left">
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-line-2 bg-black/[0.02] px-4 py-2.5 text-sm text-ink-2">
        <span>Profil rasmi (ixtiyoriy)</span>
        <input
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          className="max-w-[45%] text-xs"
        />
      </label>
      <input name="name" defaultValue={typed?.name ?? ""} placeholder="Ismingiz *" required maxLength={80} className={inputClass} />
      <textarea
        name="bio" defaultValue={typed?.bio ?? ""}
        placeholder="Qisqa bio (ixtiyoriy)"
        rows={2}
        maxLength={280}
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-3">
        <input name="telegram" defaultValue={typed?.telegram ?? ""} placeholder="Telegram @username" className={inputClass} />
        <input name="instagram" defaultValue={typed?.instagram ?? ""} placeholder="Instagram @username" className={inputClass} />
        <input name="linkedin" defaultValue={typed?.linkedin ?? ""} placeholder="LinkedIn — aziz-karimov" className={inputClass} />
      </div>
      <input name="website" defaultValue={typed?.website ?? ""} placeholder="Veb-sayt (ixtiyoriy)" className={inputClass} />

      {!state.ok && state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-lime px-6 py-3 font-medium text-flex-black transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {isPending
          ? "Yuborilmoqda..."
          : paymentEnabled
            ? `${priceLabel} — To'lovga o'tish`
            : `${priceLabel} — Band qilish`}
      </button>
      <p className="text-center text-xs text-ink-3">
        {paymentEnabled
          ? "Keyingi qadamda Click yoki Payme tanlaysiz."
          : "Hozircha to'lov tizimi ulanmagan — bu demo/test rejimida bepul band qilish."}
      </p>
    </form>
  );
}
