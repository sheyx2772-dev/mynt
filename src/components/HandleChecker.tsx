"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { parseHandle } from "@/lib/pricing";

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
              ? "flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] p-1.5 backdrop-blur-sm focus-within:border-lime/50"
              : "flex items-center gap-2 rounded-2xl border border-black/12 bg-white p-1.5 shadow-sm focus-within:border-flex-black/40"
          }
        >
          <span
            className={
              dark
                ? "pl-3 font-tabular text-sm text-white/40"
                : "pl-3 font-tabular text-sm text-flex-black/40"
            }
          >
            flex.com.uz/
          </span>
          <input
            aria-label={labels.letters}
            value={letters}
            onChange={(e) => {
              setLetters(e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3));
              setError(null);
            }}
            placeholder="AAA"
            className={
              dark
                ? "w-16 bg-transparent py-2 text-center font-display text-lg font-semibold tracking-tight text-white outline-none placeholder:text-white/25"
                : "w-16 bg-transparent py-2 text-center font-display text-lg font-semibold tracking-tight outline-none placeholder:text-flex-black/20"
            }
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
