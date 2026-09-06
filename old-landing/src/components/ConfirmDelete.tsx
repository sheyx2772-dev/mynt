"use client";

import { useState, useTransition } from "react";

// Two taps for anything that cannot be undone, and a result that is read.
//
// The menu screens deleted a category — a whole section of a café's menu, with
// every dish under it — on the first tap of a 12px text button, sitting in a
// row of reorder arrows on a phone propped up at a till. The action then
// discarded what `removeCategory` returned, so a delete that failed looked
// exactly like one that worked: the row stayed, and the manager tapped again.
//
// The wording of the second tap says what will go, because "are you sure" asks
// somebody to confirm a thing they were not told.
export default function ConfirmDelete({
  action,
  what,
  label = "O'chirish",
  className = "",
}: {
  action: () => Promise<{ ok: boolean; error?: string }>;
  /** Named in the confirmation, e.g. "Salatlar va undagi 6 ta taom". */
  what: string;
  label?: string;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`min-h-11 rounded-plate px-2 text-xs text-paper-3 transition-colors hover:text-danger-ink ${className}`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="max-w-[16rem] text-right text-xs text-paper-2">
        {what} o&apos;chadi. Buni qaytarib bo&apos;lmaydi.
      </p>
      {error && <p className="text-xs text-danger-ink">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await action();
              if (!result.ok) {
                setError(result.error ?? "O'chirilmadi. Qaytadan urinib ko'ring.");
                return;
              }
              setConfirming(false);
            })
          }
          className="min-h-11 rounded-plate bg-danger-ink/15 px-3.5 text-xs font-medium text-danger-ink disabled:opacity-50"
        >
          {pending ? "O'chirilmoqda…" : "Ha, o'chirilsin"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className="min-h-11 rounded-plate border border-ink-line px-3.5 text-xs font-medium"
        >
          Bekor qilish
        </button>
      </div>
    </div>
  );
}
