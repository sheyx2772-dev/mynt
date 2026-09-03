import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

import { setupSteps, type SetupState } from "@/lib/venue-setup";
import type { VenueWords } from "@/lib/venue-words";

// The four things that have to happen before a venue works.
//
// Numbered because the order is real rather than decorative: a menu with no
// tags is a page nobody can reach, and tags with no counter link produce calls
// nobody sees. The next undone step is the only one that looks like a button;
// the rest are quiet, so there is never a question about what to do now.

export default function VenueSetup({
  handle,
  state,
  w,
}: {
  handle: string;
  state: SetupState;
  w: VenueWords;
}) {
  const steps = setupSteps(state, w);
  const next = steps.find((step) => !step.done);
  const done = steps.filter((step) => step.done).length;

  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-[0_20px_45px_-30px_rgba(14,10,27,0.3)]">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display font-semibold tracking-tight">Ishga tushirish</h2>
        <span className="font-tabular text-sm text-flex-black/40">
          {done}/{steps.length}
        </span>
      </div>

      <ol className="space-y-1.5">
        {steps.map((step, index) => {
          const isNext = step.key === next?.key;

          return (
            <li key={step.key}>
              <Link
                href={`/kabinet/${handle}/${step.screen}`}
                className={
                  isNext
                    ? "flex items-center gap-3 rounded-2xl bg-flex-black px-4 py-3.5 text-white transition-transform active:scale-[0.99]"
                    : "flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-black/[0.02]"
                }
              >
                <span
                  className={
                    step.done
                      ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime text-flex-black"
                      : isNext
                        ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/25 font-tabular text-xs text-white/70"
                        : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/10 font-tabular text-xs text-flex-black/35"
                  }
                >
                  {step.done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={
                      step.done && !isNext
                        ? "block text-sm font-medium text-flex-black/45"
                        : "block text-sm font-medium"
                    }
                  >
                    {step.title}
                  </span>
                  <span
                    className={
                      isNext
                        ? "mt-0.5 block text-xs text-white/55"
                        : "mt-0.5 block text-xs text-flex-black/40"
                    }
                  >
                    {step.hint}
                  </span>
                </span>

                {isNext && <ChevronRight className="h-4 w-4 shrink-0 text-white/50" />}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
