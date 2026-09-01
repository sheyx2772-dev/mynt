"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

// Sharing a profile, marked as a share.
//
// The link carries ?src=share so the owner's breakdown can separate people who
// arrived from a forwarded link from people who tapped the card. Without a
// button that issues it, the source would be recorded and never produced —
// which is the state this was in until now.

export default function ShareButton({ handle, name }: { handle: string; name: string }) {
  const [copied, setCopied] = useState(false);
  // Shown when the clipboard refuses. Some browsers deny the write outright,
  // and a button that then does nothing looks broken — so the link is put on
  // screen to be copied by hand instead.
  const [manual, setManual] = useState<string | null>(null);

  async function share() {
    const url = `${window.location.origin}/${handle}?src=share`;

    // On a phone this opens the system sheet, which is where a profile
    // actually gets sent from. Everywhere else it lands on the clipboard.
    if (navigator.share) {
      try {
        await navigator.share({ title: name || handle, url });
        return;
      } catch {
        // Dismissed, or unavailable despite being present. Fall through.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setManual(null);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setManual(url);
    }
  }

  if (manual) {
    return (
      <div className="rounded-2xl border border-black/12 px-4 py-3">
        <p className="mb-2 text-xs text-flex-black/45">
          Havolani nusxalab oling:
        </p>
        <input
          readOnly
          value={manual}
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
          className="w-full bg-transparent font-tabular text-sm outline-none"
        />
      </div>
    );
  }

  return (
    <button
      onClick={share}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/12 px-6 py-3 text-center font-medium text-flex-black transition-colors hover:bg-black/[0.03]"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-lime-ink" />
          Havola nusxalandi
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Ulashish
        </>
      )}
    </button>
  );
}
