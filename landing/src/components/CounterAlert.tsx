"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";

import { decideAlert } from "@/lib/counter-alert";

// The noise the counter phone makes.
//
// Without it the screen is a dashboard: it knows a table is waiting and tells
// nobody, so a waiter still has to walk past and look. With it the same screen
// is a call system, which is the thing a cafe is actually buying.
//
// Three things a phone left on a counter needs, and each is here for a reason
// somebody would hit within an hour of using it:
//
//   - The sound is synthesised rather than a file, so there is no asset to
//     fetch, nothing to cache, and it still works on the day the network is bad.
//   - It cannot start on its own. Browsers refuse audio until somebody has
//     interacted with the page, and rightly, so there is a button — pressed
//     once in the morning. The preference is remembered, but the press is still
//     required after a genuine reload; the button reappears when it is.
//   - The screen is held awake while the sound is on. A phone that dims to
//     black thirty seconds after being propped up is showing nobody anything.

const PREF_KEY = "flex.counter.sound";

export default function CounterAlert({ waiting }: { waiting: string[] }) {
  const [on, setOn] = useState(false);
  const [flash, setFlash] = useState(false);

  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const lock = useRef<WakeLockSentinel | null>(null);

  // Whether the sound was on yesterday. Read through the store rather than in
  // an effect, so the button does not appear and then vanish on every load.
  const [wanted] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(PREF_KEY) === "1";
    } catch {
      return false;
    }
  });

  function ring() {
    const ctx = audio.current;
    if (!ctx || ctx.state !== "running") return;

    // Two short rising tones. Long enough to hear across a room, short enough
    // that nobody minds it happening forty times a night.
    for (const [at, hz] of [
      [0, 880],
      [0.18, 1320],
    ] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = hz;

      const start = ctx.currentTime + at;
      // Ramped rather than switched: a square edge on a phone speaker clicks.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    }
  }

  async function enable() {
    try {
      const ctx = audio.current ?? new AudioContext();
      audio.current = ctx;
      // Created suspended when the page has not been touched yet; this is the
      // touch.
      if (ctx.state === "suspended") await ctx.resume();

      setOn(ctx.state === "running");
      try {
        localStorage.setItem(PREF_KEY, "1");
      } catch {
        // Private browsing. The sound still works for this shift.
      }

      ring();
      await hold();
    } catch {
      // No audio on this device. The list still updates and still flashes.
      setOn(false);
    }
  }

  async function hold() {
    try {
      if (!("wakeLock" in navigator) || lock.current) return;
      lock.current = await navigator.wakeLock.request("screen");
      lock.current.addEventListener("release", () => {
        lock.current = null;
      });
    } catch {
      // Refused, or the battery is too low for the browser to allow it. The
      // phone will dim; nothing else breaks.
    }
  }

  // A lock is dropped whenever the tab goes to the background, so it has to be
  // taken again when it comes back — otherwise the screen stays awake only
  // until the first time somebody switches away.
  useEffect(() => {
    if (!on) return;
    const wake = () => {
      if (!document.hidden) void hold();
    };
    document.addEventListener("visibilitychange", wake);
    return () => document.removeEventListener("visibilitychange", wake);
  }, [on]);

  // The whole point: what is on the list now that was not on it before.
  useEffect(() => {
    const { fresh, ring: shouldRing } = decideAlert(seen.current, waiting, primed.current);
    fresh.forEach((id) => seen.current.add(id));
    primed.current = true;

    if (!shouldRing) return;

    ring();
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 1400);
    return () => clearTimeout(timer);
  }, [waiting]);

  return (
    <>
      {/* Seen from across a room, over the shoulder of whoever is at the till.
          Pointer-events off so it can never swallow a tap on a request. */}
      {flash && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-40 animate-pulse border-[6px] border-lime motion-reduce:animate-none"
        />
      )}

      {!on && (
        <button
          type="button"
          onClick={enable}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime px-5 py-3.5 font-medium text-flex-black"
        >
          <Volume2 className="h-4 w-4" />
          {wanted ? "Ovozni qayta yoqing" : "Ovozni yoqish"}
        </button>
      )}
    </>
  );
}
