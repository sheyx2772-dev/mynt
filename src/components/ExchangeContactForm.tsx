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
      <div className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-line bg-fill px-5 text-[16px] font-semibold text-ink-2">
        <Check className="h-5 w-5" />
        {t.sent}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-line-2 bg-white px-5 text-[16px] font-semibold text-ink transition-transform duration-[120ms] active:scale-[0.98] active:bg-fill"
      >
        <UserRoundPlus className="h-5 w-5" />
        {t.sendContact}
      </button>
    );
  }

  const field =
    // 16px and not a pixel less: Android Chrome zooms the page when a field
    // under that size takes focus, and on a form this tall the send button
    // then leaves the screen.
    "h-[52px] w-full rounded-input border border-line-2 bg-white px-4 text-[16px] text-ink outline-none placeholder:text-ink-3 focus:border-ink";

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
      className="rounded-card border border-line bg-white p-4"
    >
      <p className="text-[17px] leading-6 font-semibold">
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

      <p className="mt-2 text-[13px] leading-[18px] text-ink-3">
        {t.contactHint}
      </p>

      {error && <p className="mt-2 text-[13px] leading-[18px] text-danger">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-[52px] flex-1 rounded-full bg-ink px-5 text-[16px] font-semibold text-paper transition-transform duration-[120ms] active:scale-[0.98] disabled:bg-fill disabled:text-ink-3"
        >
          {pending ? t.sending : t.send}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-[52px] rounded-full px-5 text-[16px] font-medium text-ink-2"
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
