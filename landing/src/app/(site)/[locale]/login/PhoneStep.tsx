"use client";

import { useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { formatPhone, phoneDigits } from "@/lib/phone";
import type { AskState } from "./actions";

const FIELD =
  "h-14 w-full rounded-input border border-line-2 bg-white px-4 text-lg tracking-[0.02em] text-ink transition-colors placeholder:text-[15px] placeholder:tracking-normal placeholder:text-line-lead focus:border-ink focus:ring-2 focus:ring-ring focus:outline-none";

/**
 * The number, grouped as it is typed.
 *
 * `+998 90 123 45 67` can be checked at a glance; twelve digits in a row have
 * to be read one at a time, and this is a field people fill in from memory
 * while holding the phone they are about to be texted on. The dial code is
 * seeded rather than left to be typed, because nine keystrokes out of twelve
 * are the same on every number anybody here will enter — and it stays editable,
 * because the backend takes foreign numbers.
 */
export default function PhoneStep({
  value,
  onValue,
  action,
  busy,
  error,
}: {
  /** Digits only. The grouping is a rendering, not a value. */
  value: string;
  onValue: (digits: string) => void;
  action: (form: FormData) => void;
  busy: boolean;
  error: AskState["error"];
}) {
  const t = useTranslations("login");
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const shown = formatPhone(value);

  // Inserting a space shifts everything after it, so the caret has to be put
  // back where the person was typing. Before paint: in a plain effect the
  // browser draws one frame with the caret at the end of the field.
  useLayoutEffect(() => {
    if (caret.current === null || !input.current) return;
    input.current.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  function retype(raw: string, upTo: number) {
    let digits = phoneDigits(raw);
    let typed = phoneDigits(raw.slice(0, upTo));

    // Backspace on one of the spaces we inserted deletes a character the
    // person never typed, so re-grouping puts it straight back and the key
    // appears to be broken. Taking the digit in front of it is what they meant.
    if (raw.length < shown.length && formatPhone(digits) === shown) {
      digits = digits.slice(0, -1);
      typed = typed.slice(0, -1);
    }

    onValue(digits);
    caret.current = formatPhone(typed).length;
  }

  return (
    <form action={action}>
      <label htmlFor="phone" className="cap mb-1.5 block text-ink-3">
        {t("phoneLabel")}
      </label>

      <input
        ref={input}
        id="phone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        autoFocus
        enterKeyHint="send"
        // The formatted length of a full Uzbek number: twelve digits, a plus
        // sign and four spaces is seventeen characters. 18 allows the final digit.
        maxLength={18}
        value={shown}
        onChange={(event) =>
          retype(
            event.target.value,
            event.target.selectionStart ?? event.target.value.length,
          )
        }
        placeholder="+998 90 123 45 67"
        className={FIELD}
      />

      <p className="mt-2 text-[13px] leading-5 text-ink-3">{t("phoneHint")}</p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {t(error === "phone" ? "errorPhone" : "errorSend")}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 flex h-12 w-full items-center justify-center rounded-input bg-lime text-sm font-semibold text-ink transition-colors hover:bg-lime-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60"
      >
        {busy ? t("sending") : t("send")}
      </button>
    </form>
  );
}
