"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startSubscription } from "@/app/tarif/actions";

// Buying premium for one of your own handles.
//
// The handle picker is part of the button rather than a separate page: an owner
// may hold several numbers and pay for one of them, and asking which one after
// they have decided to pay is one screen fewer than asking before.

export default function SubscribeButton({
  handles,
  period,
}: {
  handles: { normalized: string; premium: boolean }[];
  period: "monthly" | "yearly";
}) {
  const eligible = handles.filter((h) => !h.premium);
  const [choice, setChoice] = useState(eligible[0]?.normalized ?? "");
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{ click?: string; payme?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (handles.length === 0) {
    return (
      <p className="mt-6 text-sm text-white/45">
        Premiumni yoqish uchun avval raqam sotib oling.
      </p>
    );
  }

  if (eligible.length === 0) {
    return (
      <p className="mt-6 text-sm text-white/45">
        Barcha raqamlaringiz allaqachon premiumda.
      </p>
    );
  }

  if (checkout) {
    return (
      <div className="mt-6 space-y-2">
        <p className="text-sm text-white/60">To&apos;lov tizimini tanlang:</p>
        {checkout.payme && (
          <a
            href={checkout.payme}
            className="block rounded-xl bg-white px-5 py-3 text-center text-[11px] font-semibold tracking-[0.16em] text-flex-black uppercase"
          >
            Payme
          </a>
        )}
        {checkout.click && (
          <a
            href={checkout.click}
            className="block rounded-xl border border-white/20 px-5 py-3 text-center text-[11px] font-semibold tracking-[0.16em] text-white uppercase"
          >
            Click
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6">
      {eligible.length > 1 && (
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          aria-label="Qaysi raqam uchun"
          className="mb-2 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 font-tabular text-sm text-white outline-none"
        >
          {eligible.map((h) => (
            <option key={h.normalized} value={h.normalized} className="text-flex-black">
              {h.normalized}
            </option>
          ))}
        </select>
      )}

      <button
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await startSubscription(choice, period);
            if (result.needsAuth) {
              router.push("/kirish?keyin=/tarif");
              return;
            }
            if (result.ok && result.checkout) setCheckout(result.checkout);
            else setError(result.error ?? "Bo'lmadi.");
          })
        }
        disabled={pending}
        className="w-full rounded-xl bg-white px-5 py-3 text-[11px] font-semibold tracking-[0.16em] text-flex-black uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending
          ? "Kutib turing"
          : eligible.length > 1
            ? `${choice} uchun yoqish`
            : "Premiumni yoqish"}
      </button>

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
