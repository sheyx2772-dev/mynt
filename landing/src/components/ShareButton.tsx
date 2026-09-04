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

  // The clipboard can be refused outright, and a button that then does nothing
  // looks broken. The link goes on screen instead, selected, to be copied by
  // hand — over the card rather than in place of the button, so nothing below
  // it moves.
  if (manual) {
    return (
      <div className="absolute top-0 right-0 z-10 w-[min(20rem,80vw)] rounded-2xl border border-white/15 bg-flex-black px-4 py-3 shadow-xl">
        <p className="mb-1.5 text-xs text-white/45">Havolani nusxalab oling:</p>
        <input
          readOnly
          value={manual}
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
          onBlur={() => setManual(null)}
          className="w-full bg-transparent font-tabular text-xs text-white outline-none"
        />
      </div>
    );
  }

  return (
    <button
      onClick={share}
      aria-label="Profilni ulashish"
      title="Profilni ulashish"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white"
    >
      {copied ? <Check className="h-4 w-4 text-lime" /> : <Share2 className="h-4 w-4" />}
    </button>
  );
}
