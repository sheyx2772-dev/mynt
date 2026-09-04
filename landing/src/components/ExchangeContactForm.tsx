"use client";

import { useState, useTransition } from "react";
import { UserRoundPlus, Check } from "lucide-react";
import { submitLead } from "@/app/[handle]/actions";

export type Words = {
  sent: string;
  sendContact: string;
  reachYou: string;
  contactHint: string;
  yourName: string;
  phone: string;
  company: string;
  note: string;
  send: string;
  sending: string;
  cancel: string;
};

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
  source,
  t,
}: {
  handle: string;
  source?: string;
  // Plain strings rather than the dictionary: two of its entries are functions
  // that take the owner's name, and a function cannot cross into a client
  // component. Resolving them on the server is also the only place the owner's
  // name is already known.
  t: Words;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-6 py-3.5 text-[11px] font-semibold tracking-[0.16em] text-white/70 uppercase">
        <Check className="h-4 w-4 text-[color:var(--accent)]" />
        {t.sent}
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
        {t.sendContact}
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
        {t.reachYou}
      </p>

      <div className="mt-3 space-y-2">
        <input name="name" placeholder={t.yourName} maxLength={80} required className={field} />
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder={t.phone}
          maxLength={30}
          className={field}
        />
        <input name="email" type="email" placeholder="Email" maxLength={120} className={field} />
        <input name="company" placeholder={t.company} maxLength={80} className={field} />
        <textarea
          name="note"
          rows={2}
          placeholder={t.note}
          maxLength={500}
          className={`${field} resize-none`}
        />
      </div>

      <p className="mt-2 text-[11px] leading-snug text-white/35">
        {t.contactHint}
      </p>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-white px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-flex-black uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? t.sending : t.send}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-white/12 px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-white/50 uppercase transition-colors hover:text-white/80"
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
