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
  className,
}: {
  handle: string;
  source?: string;
  // Plain strings rather than the dictionary: two of its entries are functions
  // that take the owner's name, and a function cannot cross into a client
  // component. Resolving them on the server is also the only place the owner's
  // name is already known.
  t: Words;
  /** The shape, supplied by whichever layout is rendering it. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <div
        className={
          className ??
          "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink/[0.045] px-3 py-2 text-[16px] leading-5 font-medium text-balance text-mute"
        }
      >
        <Check className="h-5 w-5" />
        {t.sent}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={
          className ??
          "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink/[0.04] px-3 py-2 text-[16px] leading-5 font-medium text-balance text-ink shadow-deboss active:bg-ink/5"
        }
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
    "h-14 w-full rounded-lg border border-ink/15 bg-sheet px-4 text-[16px] text-ink outline-none placeholder:text-mute focus:border-ink";

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
      className="rounded-xl bg-ink/[0.04] p-4 shadow-deboss"
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

      <p className="mt-2 text-[16px] leading-6 text-mute">
        {t.contactHint}
      </p>

      {error && <p className="mt-2 text-[16px] leading-6 text-danger">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-14 flex-1 items-center justify-center rounded-xl bg-slab px-5 text-[16px] font-semibold text-on-slab shadow-slab active:translate-y-px active:shadow-none disabled:bg-ink/20 disabled:shadow-none"
        >
          {pending ? t.sending : t.send}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-14 rounded-xl px-5 text-[16px] font-medium text-mute"
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
