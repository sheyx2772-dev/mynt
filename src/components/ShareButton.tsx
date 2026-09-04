"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

// Sharing a profile, marked as a share.
//
// The link carries ?src=share so the owner's breakdown can separate people who
// arrived from a forwarded link from people who tapped the card. Without a
// button that issues it, the source would be recorded and never produced —
// which is the state this was in until now.

export default function ShareButton({
  handle,
  name,
  className,
  label,
}: {
  handle: string;
  name: string;
  /** The shape, supplied by whichever layout is rendering it. */
  className?: string;
  /** Set where the layout wants words rather than a glyph alone. */
  label?: string;
}) {
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
      <div className="absolute top-0 right-0 z-10 w-[min(20rem,80vw)] rounded-card border border-line bg-white px-4 py-3">
        <p className="mb-1.5 text-[13px] leading-[18px] text-ink-3">Havolani nusxalab oling:</p>
        <input
          readOnly
          value={manual}
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
          onBlur={() => setManual(null)}
          className="num w-full bg-transparent text-[13px] leading-[18px] text-ink outline-none"
        />
      </div>
    );
  }

  return (
    <button
      onClick={share}
      aria-label="Profilni ulashish"
      title="Profilni ulashish"
      className={
        className ??
        "flex h-11 w-11 items-center justify-center rounded-full border border-line-2 bg-white text-ink-2 transition-colors active:bg-fill"
      }
    >
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      {label}
    </button>
  );
}
