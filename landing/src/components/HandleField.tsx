"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";

import {
  digitRarity,
  isBlocked,
  letterRarity,
  priceForHandle,
} from "@/lib/pricing";

// The number, as it is typed.
//
// Three letters then three digits, enforced while typing rather than at
// submit. `pattern` only speaks when the form is sent, so before this the
// field happily took SDFSDF and said nothing until somebody pressed the
// button — six characters of work thrown away for a rule nobody had been
// told.
//
// It also prices as it goes, which is the reason it is worth shipping any
// JavaScript here at all. Rarity is the product's whole story: `SDF423` is
// 100 000 and `AAA777` is 120 million, and a visitor learns that by typing,
// in the second it takes, rather than by reading a table.
//
// The arithmetic is local. The rules are a few lines and they are mirrored
// from the Go the server charges with, guarded by a test that hashes both
// lists — so this cannot quietly disagree with the price at checkout. A round
// trip per keystroke would be the alternative, on a mobile network, for a sum
// this small.
//
// Without JavaScript the field is a plain input with `pattern` and `required`:
// the filtering and the price go, the form still submits, and the server still
// answers.

/** Positions 0-2 take letters, 3-5 take digits. Anything else is dropped. */
function mask(raw: string): string {
  let out = "";
  for (const ch of raw.toUpperCase()) {
    if (out.length < 3) {
      if (ch >= "A" && ch <= "Z") out += ch;
    } else if (out.length < 6) {
      if (ch >= "0" && ch <= "9") out += ch;
    }
  }
  return out;
}

export default function HandleField({
  id,
  name,
  defaultValue = "",
  title,
  className,
  placeholder,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  title: string;
  className: string;
  placeholder: string;
}) {
  const t = useTranslations("rarity");
  const format = useFormatter();

  const [value, setValue] = useState(() => mask(defaultValue));
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);

  // Dropping a character shifts everything after it, so the caret has to be
  // put back where the person was typing. In an effect that runs before paint:
  // in a plain effect the browser draws one frame with the caret at the end.
  useLayoutEffect(() => {
    if (caret.current === null || !input.current) return;
    input.current.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  const letters = value.slice(0, 3);
  const digits = value.slice(3, 6);
  const complete = value.length === 6;
  const blocked = complete && isBlocked(letters);
  const quote = complete && !blocked;

  return (
    <>
      <input
        ref={input}
        id={id}
        name={name}
        value={value}
        onChange={(event) => {
          const raw = event.target.value;
          const before = raw.slice(0, event.target.selectionStart ?? raw.length);
          setValue(mask(raw));
          caret.current = mask(before).length;
        }}
        required
        maxLength={6}
        pattern="[A-Za-z]{3}[0-9]{3}"
        title={title}
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="go"
        placeholder={placeholder}
        className={className}
      />

      {/* Under the plate, in the flow, so nothing jumps when it appears. */}
      {quote && (
        <p
          aria-live="polite"
          className="pointer-events-none absolute top-full left-0 mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px]"
        >
          <span className="font-mono font-semibold tracking-[0.06em] text-ink">
            {format.number(priceForHandle(letters, digits))} {t("soum")}
          </span>
          <span className="text-ink-3">
            {t(`letters${letterRarity(letters).multiplier}`)} ·{" "}
            {t(`digits${digitRarity(digits).multiplier}`)}
          </span>
        </p>
      )}

      {blocked && (
        <p
          aria-live="polite"
          className="absolute top-full left-0 mt-3 text-[13px] text-danger"
        >
          {t("blocked")}
        </p>
      )}
    </>
  );
}
