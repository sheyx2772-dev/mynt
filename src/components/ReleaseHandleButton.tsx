"use client";

import { useState, useTransition } from "react";
import { releaseHandle } from "@/app/kabinet/jamoa/actions";

// Offboarding is destructive and cannot be undone: the leaver's name, photo,
// number and links are gone, not archived. So it asks once, in words that say
// what will actually happen, rather than behind a generic "are you sure".

export default function ReleaseHandleButton({
  handle,
  holderName,
}: {
  handle: string;
  holderName: string | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-ink-line px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-ink-s2"
      >
        Bo&apos;shatish
      </button>
    );
  }

  return (
    <div className="text-right">
      <p className="mb-1.5 max-w-xs text-xs text-paper-2">
        {holderName ? `${holderName}ning` : "Bu profildagi"} ismi, surati, telefoni va
        havolalari o&apos;chadi. {handle} firmada qoladi.
      </p>
      {error && <p className="mb-1.5 text-xs text-danger-ink">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          onClick={() =>
            startTransition(async () => {
              const result = await releaseHandle(handle);
              if (!result.ok) setError(result.error ?? "Bo'lmadi.");
              else setConfirming(false);
            })
          }
          disabled={pending}
          className="rounded-lg bg-ink-s2 px-3.5 py-1.5 text-xs font-medium text-paper disabled:opacity-50"
        >
          {pending ? "..." : "O'chirish"}
        </button>
        <button
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className="rounded-lg border border-ink-line px-3.5 py-1.5 text-xs font-medium"
        >
          Bekor
        </button>
      </div>
    </div>
  );
}
