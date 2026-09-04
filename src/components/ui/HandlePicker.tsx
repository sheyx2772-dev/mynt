"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { parseHandle } from "@/lib/pricing";
import { button } from "./Buttons";

// The last block on the front page, and the strongest one.
//
// Somebody who types three letters and three digits into this has stopped
// reading about the product and started owning a piece of it — the number on
// the screen is theirs before they have paid for anything. That is the whole
// mechanism, and it is why this is a field rather than another "Contact us".
//
// It is drawn as the plate, because what they are filling in is the thing that
// will be struck into the card. The older version coloured the digits lime,
// which broke two rules at once: lime as text, at 1.2:1 on white — half the
// number was not on the screen.
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

  const field =
    "w-[3.6ch] bg-transparent text-center font-mono text-[30px] font-semibold tracking-[0.16em] tabular-nums text-paper outline-none placeholder:text-paper/30";

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
      <div className="inline-flex h-20 w-full items-stretch overflow-hidden rounded-md bg-ink shadow-slab">
        <span className="w-3 bg-gold/90" aria-hidden />
        <span className="flex flex-1 items-center justify-center">
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
            className={field}
          />
        </span>
        <span className="my-4 w-px bg-paper/25" aria-hidden />
        <span className="flex flex-1 items-center justify-center">
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
            className={field}
          />
        </span>
      </div>

      <button
        type="submit"
        disabled={!complete}
        className={`${button.lime} mt-3 w-full disabled:bg-paper disabled:text-mute disabled:shadow-deboss disabled:active:translate-y-0`}
      >
        {labels.submit}
        <ArrowRight className="size-5" />
      </button>

      <p className="mt-2.5 text-center text-[16px] leading-6 text-mute">
        {error ?? labels.hint}
      </p>
    </form>
  );
}
