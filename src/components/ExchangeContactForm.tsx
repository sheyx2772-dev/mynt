"use client";

import { useState, useTransition } from "react";
import { UserRoundPlus, Check } from "lucide-react";
import { submitLead } from "@/app/[handle]/actions";

// The other direction.
//
// Everything else on this card gives the owner's details away. This takes the
// visitor's, with their name on the button so it is obvious which way the
// exchange runs — a card that collects the contact is the difference between a
// nice page and a tool that pays for itself in one meeting.
//
// Closed by default: a form that opens with five empty boxes on someone else's
// profile reads as a demand. Opened only when the visitor decides to answer.

export default function ExchangeContactForm({
  handle,
  ownerName,
  source,
}: {
  handle: string;
  ownerName: string;
  source?: string;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const firstName = ownerName.split(" ")[0] || ownerName;

  if (sent) {
    return (
      <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-6 py-3.5 text-[11px] font-semibold tracking-[0.16em] text-white/70 uppercase">
        <Check className="h-4 w-4 text-[color:var(--accent)]" />
        Yuborildi
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-6 py-3.5 text-[11px] font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:border-white/30 hover:bg-white/[0.09]"
      >
        <UserRoundPlus className="h-4 w-4" />
        Kontaktimni yuborish
      </button>
    );
  }

  const field =
    "w-full rounded-lg border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30";

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          const result = await submitLead(handle, source, formData);
          if (result.ok) setSent(true);
          else setError(result.error ?? "Yuborilmadi.");
        })
      }
      className="mt-3 rounded-xl border border-white/12 bg-white/[0.03] p-4"
    >
      <p className="text-[11px] tracking-[0.14em] text-white/45 uppercase">
        {firstName} sizga bog&apos;lana olishi uchun
      </p>

      <div className="mt-3 space-y-2">
        <input name="name" placeholder="Ismingiz" maxLength={80} required className={field} />
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="Telefon"
          maxLength={30}
          className={field}
        />
        <input name="email" type="email" placeholder="Email" maxLength={120} className={field} />
        <input name="company" placeholder="Kompaniya" maxLength={80} className={field} />
        <textarea
          name="note"
          rows={2}
          placeholder="Izoh — nima haqida gaplashmoqchisiz"
          maxLength={500}
          className={`${field} resize-none`}
        />
      </div>

      <p className="mt-2 text-[11px] leading-snug text-white/35">
        Telefon yoki email — kamida bittasi. Ma&apos;lumotingiz faqat {firstName}ga
        boradi.
      </p>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-white px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-flex-black uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Yuborilyapti" : "Yuborish"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-white/12 px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-white/50 uppercase transition-colors hover:text-white/80"
        >
          Bekor
        </button>
      </div>
    </form>
  );
}
