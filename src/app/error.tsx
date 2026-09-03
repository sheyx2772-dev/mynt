"use client";

import { useEffect } from "react";

// Error boundaries must be client components. Next renders this in place of
// the page when a server or client render throws.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-6 text-center">
      <div className="relative">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Nimadir noto&apos;g&apos;ri ketdi</h1>
        <p className="mt-2 text-sm text-flex-black/60">
          Sahifani yuklab bo&apos;lmadi. Qaytadan urinib ko&apos;ring.
        </p>
        {error.digest && (
          <p className="mt-3 font-tabular text-xs text-flex-black/35">Kod: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-8 rounded-full bg-lime px-6 py-3 font-medium text-flex-black shadow-[0_12px_30px_-10px_rgba(171,255,9,0.65)] transition-transform hover:scale-[1.01]"
        >
          Qayta urinish
        </button>
      </div>
    </div>
  );
}
