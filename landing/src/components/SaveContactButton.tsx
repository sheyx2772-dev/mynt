"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

type Props = {
  handle: string;
  label: string;
  /** What the control says once the file has been handed over. */
  savedLabel: string;
  /** The shape, supplied by whichever layout is rendering it. */
  className?: string;
};

// The primary action on a profile: save this person to my phone.
//
// The card itself is built by /[handle]/vizitka rather than here. This used to
// assemble the vCard in the browser, wrap it in a Blob, and click a synthetic
// `<a download>` — which works everywhere except the place that matters. iOS
// Safari treats a blob download inconsistently, and iOS is most of the phones
// that will ever tap one of these cards. A normal link to a route that answers
// with Content-Disposition opens the Contacts sheet on both platforms.
//
// Building it on the server also means the card is made from what is stored
// rather than from whatever the page happened to render, and that the URL
// written into it is this site's address.
export default function SaveContactButton({
  handle,
  label,
  savedLabel,
  className,
}: Props) {
  // The confirmation is the control itself, for a second and a half.
  //
  // A toast would be a second thing appearing on a screen whose whole design
  // budget is one action — and on a phone it lands where the thumb already is.
  // Saying it in place answers the only question the person has, which is
  // whether the press worked.
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <a
      href={`/${handle}/vizitka`}
      onClick={() => {
        setSaved(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setSaved(false), 1500);
      }}
      className={
        className ??
        "flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-lime text-[16px] font-semibold text-on-accent shadow-slab transition-transform duration-[120ms] active:translate-y-px active:shadow-none"
      }
    >
      {saved ? (
        <>
          <Check className="h-5 w-5" />
          {savedLabel}
        </>
      ) : (
        label
      )}
    </a>
  );
}
