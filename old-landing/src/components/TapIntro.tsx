"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import Mark from "@/components/Mark";

// The half-second between the tap and the page.
//
// A card meeting a phone is the moment the product is judged, and until now it
// was a white flash and then a profile — indistinguishable from following a
// link. This is the mark on black, lit for a beat, the way a phone shows one
// when it wakes.
//
// Four rules keep it from becoming an obstacle rather than a moment:
//
//   Only after a tap. `?src=nfc` and `?src=qr` are the only ways in that carry
//   it; somebody arriving from a search result or a shared link did not tap
//   anything and would read a delay they never asked for.
//
//   Once. A tap writes to sessionStorage, so going back to the profile — or
//   moving between its tabs — does not replay it.
//
//   Never for anyone who asked their system not to animate.
//
//   It hides nothing. The profile is rendered and painted underneath the whole
//   time; this sits on top and lifts. Nothing is being waited for, so nothing
//   is being hidden — the screen would otherwise be blank for the same beat
//   while the network finishes anyway.
const KEY = "flex:tapped";
const HOLD = 900;

// Decided once per handle, the first time the client asks, and remembered:
// the same tap must answer the same way for the whole visit, and reading
// storage afresh on every render would say "seen" the moment it was marked.
const decided = new Map<string, boolean>();

function freshTap(handle: string): boolean {
  const known = decided.get(handle);
  if (known !== undefined) return known;

  let fresh = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (fresh) {
    try {
      fresh = sessionStorage.getItem(KEY) !== handle;
      sessionStorage.setItem(KEY, handle);
    } catch {
      // A private window can refuse storage. Showing it once more is a
      // smaller fault than not showing it at all, so this carries on.
    }
  }
  decided.set(handle, fresh);
  return fresh;
}

const never = () => () => {};

export default function TapIntro({ handle }: { handle: string }) {
  // Closed on the server and opened by the client's own answer, rather than
  // starting open: a splash in the HTML would cover the profile for anyone
  // whose JavaScript never arrives.
  const fresh = useSyncExternalStore(never, () => freshTap(handle), () => false);
  const [phase, setPhase] = useState<"lit" | "fading" | "done">("lit");

  useEffect(() => {
    if (!fresh) return;
    const fade = window.setTimeout(() => setPhase("fading"), HOLD);
    const gone = window.setTimeout(() => setPhase("done"), HOLD + 420);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(gone);
    };
  }, [fresh]);

  if (!fresh || phase === "done") return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-[420ms] ease-out ${
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <span className="tap-intro-mark flex items-center gap-3 text-white">
        <Mark className="h-9 w-9" tone="dark" />
        <span className="font-display text-[2rem] font-semibold tracking-tight">
          flex
        </span>
      </span>
    </div>
  );
}
