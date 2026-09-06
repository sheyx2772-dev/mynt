"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { parseHandle } from "@/lib/pricing";
import { useSanitisedInput } from "@/lib/use-sanitised-input";

// The two halves of a handle, cleaned per character so the caret can be put
// back where it was. Truncation is not here: it depends on what is already in
// the field, and the hook needs a rule it can apply to a prefix.
const onlyLetters = (raw: string) => raw.replace(/[^A-Za-z]/g, "").toUpperCase();
const onlyDigits = (raw: string) => raw.replace(/\D/g, "");

// The competitor puts this in the hero, and it is the right call: the first
// thing anyone wants to know is whether the handle they have in mind is free.
// Sending them to /{handle} answers that and prices it in one step.
export default function HandleChecker({
  tone = "light",
  labels,
}: {
  tone?: "light" | "dark";
  labels: { check: string; letters: string; digits: string; error: string };
}) {
  const dark = tone === "dark";
  const [letters, setLetters] = useState("");
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const lettersRef = useRef<HTMLInputElement>(null);
  const digitsRef = useRef<HTMLInputElement>(null);

  const onLetters = useSanitisedInput(lettersRef, (value) => {
    setLetters(value.slice(0, 3));
    setError(null);
    // Three letters is the whole of that field, and the next thing anybody
    // types is a digit. Moving on saves a tab or a tap on a phone, where the
    // second box is the harder target.
    if (value.length >= 3) digitsRef.current?.focus();
  }, onlyLetters);

  const onDigits = useSanitisedInput(digitsRef, (value) => {
    setDigits(value.slice(0, 3));
    setError(null);
  }, onlyDigits);

  // Backspace at the very start of the digits goes back to the letters, with
  // the caret at their end — the same thing a card number or an OTP does, and
  // the reason is the same: the two boxes are one value.
  function digitsKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const el = event.currentTarget;
    if (event.key !== "Backspace" || el.selectionStart !== 0 || el.selectionEnd !== 0) return;
    event.preventDefault();
    const previous = lettersRef.current;
    previous?.focus();
    previous?.setSelectionRange(previous.value.length, previous.value.length);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseHandle(`${letters}${digits}`);
    if (!parsed) {
      setError(labels.error);
      return;
    }
    router.push(`/${parsed.letters}${parsed.digits}`);
  }

  return (
    <form onSubmit={submit} className="mt-9">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={
            dark
              ? "flex items-center gap-2 rounded-2xl border border-ink-line bg-white/[0.06] p-1.5 backdrop-blur-sm focus-within:border-lime/50"
              : "flex items-center gap-2 rounded-2xl border border-line bg-white p-1.5 shadow-sm focus-within:border-flex-black/40"
          }
        >
          <span
            className={
              dark
                ? "pl-3 font-tabular text-sm text-paper-3"
                : "pl-3 font-tabular text-sm text-ink-3"
            }
          >
            flex.com.uz/
          </span>
          <input
            aria-label={labels.letters}
            ref={lettersRef}
            value={letters}
            onChange={onLetters}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="AAA"
            className={
              dark
                ? "w-16 bg-transparent py-2 text-center font-display text-lg font-semibold tracking-tight text-white outline-none placeholder:text-paper-3"
                : "w-16 bg-transparent py-2 text-center font-display text-lg font-semibold tracking-tight outline-none placeholder:text-ink-3"
            }
          />
          <input
            aria-label={labels.digits}
            inputMode="numeric"
            ref={digitsRef}
            value={digits}
            onChange={onDigits}
            onKeyDown={digitsKeyDown}
            autoComplete="off"
            placeholder="000"
            className={
              dark
                ? "num w-16 rounded-plate py-2 text-center font-display text-lg font-semibold text-paper outline-none placeholder:text-paper-3"
                : "num w-16 rounded-plate py-2 text-center font-display text-lg font-semibold text-ink outline-none placeholder:text-ink-3"
            }
          />
        </div>

        <button
          type="submit"
          className={
            dark
              ? "inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-medium text-flex-black transition-colors hover:bg-white/90"
              : "inline-flex items-center gap-2 rounded-full bg-flex-black px-6 py-3.5 font-medium text-white transition-colors hover:bg-flex-black/85"
          }
        >
          {labels.check}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p className={dark ? "mt-2.5 text-sm text-red-400" : "mt-2.5 text-sm text-red-600"}>
          {error}
        </p>
      )}
    </form>
  );
}
