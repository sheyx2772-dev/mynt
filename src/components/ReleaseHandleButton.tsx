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
        className="rounded-lg border border-black/12 px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-black/[0.03]"
      >
        Bo&apos;shatish
      </button>
    );
  }

  return (
    <div className="text-right">
      <p className="mb-1.5 max-w-xs text-xs text-flex-black/55">
        {holderName ? `${holderName}ning` : "Bu profildagi"} ismi, surati, telefoni va
        havolalari o&apos;chadi. {handle} firmada qoladi.
      </p>
      {error && <p className="mb-1.5 text-xs text-red-600">{error}</p>}
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
          className="rounded-lg bg-flex-black px-3.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {pending ? "..." : "O'chirish"}
        </button>
        <button
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className="rounded-lg border border-black/12 px-3.5 py-1.5 text-xs font-medium"
        >
          Bekor
        </button>
      </div>
    </div>
  );
}
