"use client";

import { useActionState, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";

import type { TagFormState } from "@/app/x/[token]/actions";
import { needsReply, offeredFor, tagWords, type MessageKind, type TagKind } from "@/lib/tags";
import type { Lang } from "@/lib/i18n";

// The form a stranger fills in standing next to somebody else's car.
//
// One decision, then send. The buttons are the message: pressing one is the
// whole errand for three of the four, and only "found" asks for anything back —
// because a found dog reported with no way to reach the finder helps nobody.
//
// Nothing here is required except the choice. Every field somebody has to think
// about is a field that loses the person who was doing you a favour.

export default function TagMessageForm({
  token,
  kind,
  lang,
  action,
}: {
  token: string;
  kind: TagKind;
  lang: Lang;
  action: (state: TagFormState, form: FormData) => Promise<TagFormState>;
}) {
  const [state, submit, sending] = useActionState<TagFormState, FormData>(action, {});
  const [chosen, setChosen] = useState<MessageKind | null>(null);

  const words = tagWords(kind, lang);
  const offered = offeredFor(kind);
  const wantsReply = chosen ? needsReply(chosen) : false;

  if (state.sent) {
    return (
      <section className="rounded-[1.5rem] border border-lime/50 bg-lime/[0.10] p-7 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-lime">
          <Check className="h-5 w-5 text-flex-black" />
        </span>
        <p className="mt-4 font-display text-[18px] font-semibold tracking-tight">
          {words.sent}
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-flex-black/55">
          {words.sentLead}
        </p>
      </section>
    );
  }

  return (
    <form action={submit}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="kind" value={chosen ?? ""} />

      <div className="space-y-2.5">
        {offered.map((message) => {
          const active = chosen === message;
          return (
            <button
              key={message}
              type="button"
              onClick={() => setChosen(message)}
              className={
                active
                  ? "flex w-full items-center gap-3 rounded-2xl bg-flex-black px-5 py-4 text-left text-[15px] font-semibold text-white"
                  : "flex w-full items-center gap-3 rounded-2xl border border-black/10 px-5 py-4 text-left text-[15px] transition-colors hover:border-black/25"
              }
            >
              <span
                className={
                  active
                    ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime"
                    : "h-5 w-5 shrink-0 rounded-full border border-black/15"
                }
              >
                {active && <Check className="h-3 w-3 text-flex-black" />}
              </span>
              {words.actions[message]}
            </button>
          );
        })}
      </div>

      {chosen && (
        <div className="rise mt-5 space-y-3">
          {wantsReply && (
            <div>
              <label
                htmlFor="replyTo"
                className="mb-1.5 block text-[12px] font-medium text-flex-black/50"
              >
                {words.replyLabel}
              </label>
              <input
                id="replyTo"
                name="replyTo"
                inputMode="tel"
                placeholder="+998 90 123 45 67"
                className="w-full rounded-2xl border border-black/12 px-4 py-3.5 text-[15px] outline-none placeholder:text-flex-black/25 focus:border-flex-black/40"
              />
              <p className="mt-1.5 text-[12px] text-flex-black/40">{words.replyHint}</p>
            </div>
          )}

          <input
            name="place"
            placeholder={words.placePlaceholder}
            aria-label={words.placeLabel}
            className="w-full rounded-2xl border border-black/12 px-4 py-3.5 text-[15px] outline-none placeholder:text-flex-black/25 focus:border-flex-black/40"
          />

          <textarea
            name="body"
            rows={2}
            placeholder={words.notePlaceholder}
            className="w-full resize-none rounded-2xl border border-black/12 px-4 py-3.5 text-[15px] leading-relaxed outline-none placeholder:text-flex-black/25 focus:border-flex-black/40"
          />
        </div>
      )}

      {state.error && (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-[14px] text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending || !chosen}
        className="mt-5 w-full rounded-2xl bg-flex-black px-6 py-4 text-[15px] font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:bg-black/[0.08] disabled:text-flex-black/30"
      >
        {sending ? "Yuborilyapti…" : words.send}
      </button>

      {/* The promise, under the button where somebody hesitating will read it.
          It is the reason this screen exists rather than a phone number written
          on a windscreen. */}
      <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-flex-black/40">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Telefon raqamingiz egasiga ko&apos;rinmaydi. Egasining raqami ham sizga
        ko&apos;rsatilmaydi.
      </p>
    </form>
  );
}
