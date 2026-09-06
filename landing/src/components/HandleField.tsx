"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

// The number, as it is typed, and whatever should be said underneath it.
//
// Three letters then three digits, enforced while typing rather than at
// submit. `pattern` only speaks when the form is sent, so before this the
// field took SDFSDF and said nothing until the button was pressed — six
// characters of work thrown away for a rule nobody had been told.
//
// It does not price as it goes, and that was a deliberate reversal. Quoting
// while somebody types puts a figure on a number before anyone knows whether
// it can be bought — a price under a number that turns out to be taken is
// worse than no price — and it answers the question the button is there to
// ask, so the button stops meaning anything. It also put the whole pricing
// table in the browser for the asking.
//
// So the price arrives with the answer, from the server, and the only
// JavaScript left here is the one thing the platform cannot do: refuse a
// keystroke.
//
// Without JavaScript this is a plain input with `pattern` and `required`: the
// filtering goes, the form still submits, the server still answers.

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
  asked,
  title,
  placeholder,
  checkLabel,
  children,
}: {
  id: string;
  name: string;
  /** The number the server answered about, if the page was asked one. */
  asked?: string;
  title: string;
  placeholder: string;
  checkLabel: string;
  /** The server's answer, or the hint before there is one. */
  children: React.ReactNode;
}) {
  const [value, setValue] = useState(() => mask(asked ?? ""));
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);

  // Dropping a character shifts everything after it, so the caret has to be put
  // back where the person was typing. Before paint: in a plain effect the
  // browser draws one frame with the caret at the end.
  useLayoutEffect(() => {
    if (caret.current === null || !input.current) return;
    input.current.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  return (
    <>
      <div className="flex max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
        {/* One plate. `focus-within` moves the whole thing, so the address and
            the number light up together — they are one object. */}
        <div className="flex h-14 flex-1 items-center rounded-input border border-line-2 bg-white pl-4 transition-colors focus-within:border-ink focus-within:ring-2 focus-within:ring-ring">
          <span
            aria-hidden="true"
            className="shrink-0 text-[15px] text-ink-3 select-none"
          >
            arend.uz/
          </span>

          <input
            ref={input}
            id={id}
            name={name}
            value={value}
            onChange={(event) => {
              const raw = event.target.value;
              const upTo = event.target.selectionStart ?? raw.length;
              setValue(mask(raw));
              caret.current = mask(raw.slice(0, upTo)).length;
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
            className="w-full min-w-0 bg-transparent px-1 font-mono text-xl font-semibold tracking-[0.22em] text-ink uppercase placeholder:font-normal placeholder:text-line-lead focus:outline-none"
          />

          {/* Docked inside the plate rather than standing beside it: one
              object, and no second elevation on a row that already has one.

              3px, not 4. The plate is 56 tall with a 1px border, so its inside
              is 54; a 48px button leaves 3 above and below, and 4 would have
              stood it 1px proud at every corner. The radius follows the same
              sum — 12 outside, less the border, less the inset, is 8. */}
          <button
            type="submit"
            className="m-[3px] hidden h-12 shrink-0 items-center gap-2 rounded-plate bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-s2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex"
          >
            {checkLabel}
            <ArrowRight className="size-4" strokeWidth={2} />
          </button>
        </div>

        {/* On a phone the plate takes the width and the button gets its own
            row. The alternative was flex-wrap deciding it, which hung the
            button under a gap nobody drew. */}
        <button
          type="submit"
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-input bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-s2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:hidden"
        >
          {checkLabel}
          <ArrowRight className="size-4" strokeWidth={2} />
        </button>
      </div>

      {children}
    </>
  );
}
