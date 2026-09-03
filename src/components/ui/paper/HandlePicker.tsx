"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { parseHandle } from "@/lib/pricing";
import { paperButton } from "./Button";

// The last block on the front page, and the strongest one.
//
// Somebody who types three letters and three digits into this has stopped
// reading about the product and started owning a piece of it — the number on
// the screen is theirs before they have paid for anything. That is the whole
// mechanism, and it is why this is a field rather than another "Contact us".
//
// Drawn as a Plate, because what they are filling in is the thing that will be
// engraved on the card. The older version of this control coloured the digits
// lime, which broke both rules at once: lime as text, at 1.2:1 on white.
export default function HandlePicker({
  labels,
}: {
  labels: {
    letters: string;
    digits: string;
    submit: string;
    error: string;
    hint: string;
  };
}) {
  const [letters, setLetters] = useState("");
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const complete = letters.length === 3 && digits.length === 3;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseHandle(`${letters}${digits}`);
    if (!parsed) {
      setError(labels.error);
      return;
    }
    // The profile page is where "free or taken" is actually answered, and it
    // prices the handle at the same time. Two questions, one navigation.
    router.push(`/${parsed.letters}${parsed.digits}`);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-[420px]">
      <div className="flex items-center justify-center gap-1.5 rounded-plate bg-ink px-3 py-3">
        <input
          aria-label={labels.letters}
          value={letters}
          onChange={(e) => {
            setLetters(
              e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3),
            );
            setError(null);
          }}
          placeholder="AAA"
          autoComplete="off"
          className="w-[3.6ch] bg-transparent text-center font-display text-[32px] font-bold tracking-[0.06em] text-paper outline-none placeholder:text-paper-3"
        />
        <input
          aria-label={labels.digits}
          inputMode="numeric"
          value={digits}
          onChange={(e) => {
            setDigits(e.target.value.replace(/\D/g, "").slice(0, 3));
            setError(null);
          }}
          placeholder="000"
          autoComplete="off"
          className="num w-[3.6ch] bg-transparent text-center font-display text-[32px] font-bold tracking-[0.06em] text-paper outline-none placeholder:text-paper-3"
        />
      </div>

      <button
        type="submit"
        disabled={!complete}
        className={`${paperButton.primary} mt-3 w-full`}
      >
        {labels.submit}
        <ArrowRight className="h-5 w-5" />
      </button>

      <p className="mt-2.5 text-center text-[13px] leading-[18px] text-ink-3">
        {error ?? labels.hint}
      </p>
    </form>
  );
}
