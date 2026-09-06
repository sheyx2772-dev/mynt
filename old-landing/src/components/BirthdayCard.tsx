"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cake } from "lucide-react";

import { greet } from "@/app/[handle]/actions";
import type { Greeting } from "@/lib/greetings";

// The day, on the card.
//
// On the birthday itself the card wears it — a line at the top and a little
// confetti that falls once — and for the week after it keeps taking greetings,
// because that is how long the people who missed it keep saying so. A greeting
// is an emoji and, if they like, a line; one per person per year, and a second
// tap changes the first rather than stacking.

const EMOJIS = ["🎉", "🎂", "🥳", "❤️", "🔥", "🎁", "🌹", "🙌"];

export default function BirthdayCard({
  handle,
  name,
  today,
  greetings,
  count,
  signedIn,
  isOwner,
  labels,
}: {
  handle: string;
  name: string;
  today: boolean;
  greetings: Greeting[];
  count: number;
  signedIn: boolean;
  isOwner: boolean;
  labels: {
    today: string;
    week: string;
    greet: string;
    greeted: string;
    placeholder: string;
    send: string;
    signIn: string;
    greetings: string;
  };
}) {
  const mine = greetings.find((g) => g.mine) ?? null;
  const [emoji, setEmoji] = useState(mine?.emoji ?? EMOJIS[0]);
  const [text, setText] = useState(mine?.text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await greet(handle, emoji, text.trim());
      if (!result.ok) {
        setError(result.error ?? "Yuborilmadi.");
        return;
      }
      setDone(true);
      router.refresh();
    });
  };

  const headline = (today ? labels.today : labels.week).replace("{name}", name.split(/\s+/)[0]);

  return (
    <section className="relative mt-6 overflow-hidden rounded-plate border border-line px-4 py-4" aria-label={labels.greetings}>
      {today && (
        <div className="confetti pointer-events-none absolute inset-0" aria-hidden>
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} style={{ left: `${(i * 7.3) % 100}%`, animationDelay: `${(i % 7) * 0.18}s` }} />
          ))}
        </div>
      )}

      <div className="relative flex items-center gap-3">
        <Cake className="size-5 shrink-0" strokeWidth={1.8} aria-hidden />
        <p className="text-[15px] font-semibold leading-5">{headline}</p>
      </div>

      {!isOwner && (
        <div className="relative mt-3">
          {!signedIn ? (
            <Link href={`/kirish?next=/${handle}`} className="text-sm underline underline-offset-4">
              {labels.signIn}
            </Link>
          ) : done ? (
            <p className="text-sm text-mute">{labels.greeted}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={labels.greet}>
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    role="radio"
                    aria-checked={emoji === e}
                    onClick={() => setEmoji(e)}
                    className={`flex size-10 items-center justify-center rounded-full text-xl transition-transform active:scale-95 ${
                      emoji === e ? "bg-lime" : "bg-slab/10"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={140}
                  placeholder={labels.placeholder}
                  className="h-10 min-w-0 flex-1 rounded-plate border border-line bg-transparent px-3 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending}
                  className="flex h-10 shrink-0 items-center rounded-plate bg-slab px-4 text-[11px] font-bold tracking-[0.04em] text-on-slab uppercase disabled:opacity-60"
                >
                  {emoji} {mine ? labels.greeted : labels.send}
                </button>
              </div>
              {error && <p className="mt-2 text-sm text-danger-ink">{error}</p>}
            </>
          )}
        </div>
      )}

      {greetings.length > 0 && (
        <ul className="relative mt-3 flex flex-wrap gap-2 text-sm">
          {greetings.map((g) => (
            <li key={g.id} className="flex items-center gap-1.5 rounded-full bg-slab/10 py-1 pr-3 pl-1.5">
              <span className="text-base leading-none">{g.emoji}</span>
              {g.handle ? (
                <Link href={`/${g.handle}`} className="font-medium">
                  {g.name}
                </Link>
              ) : (
                <span className="font-medium">{g.name}</span>
              )}
              {g.text && <span className="text-mute">— {g.text}</span>}
            </li>
          ))}
          {count > greetings.length && <li className="py-1 text-mute">+{count - greetings.length}</li>}
        </ul>
      )}
    </section>
  );
}
