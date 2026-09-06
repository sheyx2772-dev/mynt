"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * A controlled input that cleans what is typed without losing the caret.
 *
 * The obvious version — `onChange={(e) => set(clean(e.target.value))}` — has a
 * bug that only shows up once somebody edits rather than types: React renders
 * the cleaned string, the browser has no reason to think the caret belongs
 * anywhere in particular, and it lands at the end. So deleting the middle
 * letter of "AAA" and typing a new one writes it after the other two.
 *
 * The fix is to remember where the caret was, count how many characters the
 * cleaning removed from in front of it, and put it back that much earlier —
 * after the render, which is why this is a layout effect rather than a
 * callback. Doing it in `useEffect` would let one frame paint with the caret
 * in the wrong place, which is visible as a flicker.
 *
 * The element's ref is passed in rather than handed back, so the caller owns
 * it: two fields that hand focus to each other have to be able to name each
 * other, and a ref that only exists inside the hook cannot be named until
 * after the hook has run.
 */
export function useSanitisedInput(
  ref: React.RefObject<HTMLInputElement | null>,
  setValue: (value: string) => void,
  clean: (raw: string) => string,
) {
  const caret = useRef<number | null>(null);

  useLayoutEffect(() => {
    const at = caret.current;
    caret.current = null;
    // Only touch the selection of a field somebody is actually in. Moving it
    // on a blurred input is what steals focus back from the next field.
    if (at !== null && ref.current && document.activeElement === ref.current) {
      ref.current.setSelectionRange(at, at);
    }
  });

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    const at = event.target.selectionStart ?? raw.length;
    const cleaned = clean(raw);

    // What the cleaning took out from before the caret. `clean` is applied to
    // the prefix on its own, which is why it has to be a per-character rule —
    // a filter and a case change qualify, a truncation is handled by the
    // `min` below instead.
    const removed = at - clean(raw.slice(0, at)).length;
    caret.current = Math.min(Math.max(at - removed, 0), cleaned.length);

    setValue(cleaned);
  }

  return onChange;
}
