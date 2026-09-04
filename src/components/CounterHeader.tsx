"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";

import {
  countIsTrustworthy,
  linkState,
  linkWords,
  type Link,
} from "@/lib/connection";

// The counter's header, its refresh, and its own opinion about whether it is
// connected.
//
// The three are one component because the count is only true while the phone is
// connected. "bo'sh" beside a venue's name is a claim about the room; during an
// outage it is a claim about a stale list, and leaving the server's number there
// is how a blind screen goes on looking like a quiet afternoon.
//
// This replaces AutoRefresh on the till screen. The difference is the order of
// operations: ask the server whether it is there, and refresh only if it
// answered. A refresh that fails during an outage resolves quietly, so a screen
// that only refreshes has no way to know it has gone blind.
//
// Connectivity is read through useSyncExternalStore rather than held in state,
// because that is what it is: something outside React that changes on its own.
// Keeping it in state meant setting state from an effect and reading the clock
// during render, both of which React is right to object to.

const TIMEOUT_MS = 6000;

type Snapshot = { state: Link; since: number };

const CONNECTED: Snapshot = { state: "live", since: 0 };

function makeStore() {
  let snapshot: Snapshot = CONNECTED;
  const listeners = new Set<() => void>();

  return {
    read: () => snapshot,
    write(next: Snapshot) {
      // Same values, same object: a new one every tick would wake every
      // subscriber ten times a minute for nothing.
      if (next.state === snapshot.state && next.since === snapshot.since) return;
      snapshot = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export default function CounterHeader({
  venueName,
  waiting,
  seconds = 10,
}: {
  venueName: string;
  waiting: number;
  seconds?: number;
}) {
  const router = useRouter();
  const store = useMemo(() => makeStore(), []);

  // The router is read from a ref inside the timer so that a new router object
  // does not restart the probe, and the ref is filled in an effect rather than
  // during render.
  const refresh = useRef<() => void>(() => {});
  useEffect(() => {
    refresh.current = () => router.refresh();
  }, [router]);

  const { state, since } = useSyncExternalStore(
    store.subscribe,
    store.read,
    () => CONNECTED,
  );

  useEffect(() => {
    // Locals, not refs: the timer is the only reader and it lives exactly as
    // long as this effect does.
    let failures = 0;
    let lastSeen = Date.now();
    let stopped = false;

    const probe = async () => {
      if (stopped || document.hidden) return;

      let alive = false;
      try {
        // Its own deadline. Without one a request on a dead Wi-Fi can hang past
        // several ticks, and the screen would stay confident while nothing is
        // getting through at all.
        const res = await fetch("/api/tirik", {
          cache: "no-store",
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        alive = res.ok || res.status === 204;
      } catch {
        alive = false;
      }

      if (stopped) return;

      if (alive) {
        failures = 0;
        lastSeen = Date.now();
        store.write(CONNECTED);
        // Whatever arrived while the screen was blind is on the server waiting
        // to be shown, so the tick that ends an outage is the important one.
        refresh.current();
        return;
      }

      failures += 1;
      store.write({
        state: linkState(failures),
        since: Date.now() - lastSeen,
      });
    };

    // Once immediately, so a phone woken up at nine in the morning does not
    // spend the first ten seconds claiming to be connected.
    void probe();
    const timer = setInterval(() => void probe(), seconds * 1000);

    // Coming back to the tab is when the list is most stale, and when the
    // connection is most likely to have changed underneath it.
    const wake = () => void probe();
    document.addEventListener("visibilitychange", wake);
    // The browser's own signal is not trusted as evidence of being connected —
    // it only knows about the network interface, and the usual cafe outage is
    // the one that lies about exactly that — but it is a good reason to go and
    // check now rather than waiting out the timer.
    window.addEventListener("online", wake);
    window.addEventListener("offline", wake);

    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
      window.removeEventListener("offline", wake);
    };
  }, [seconds, store]);

  const words = linkWords(state, since);
  const trust = countIsTrustworthy(state);

  return (
    <>
      <header className="mb-5 flex items-baseline justify-between gap-3">
        <h1 className="truncate text-[24px] leading-7 font-semibold tracking-[-0.01em] text-paper">
          {venueName}
        </h1>
        {/* paper-2, not paper-3: the faint tier is unreadable at two metres,
            which is the only distance this screen is ever read from. */}
        <span className="num shrink-0 text-[20px] leading-7 text-paper-2">
          {!trust ? "aloqa yo'q" : waiting > 0 ? `${waiting} ta kutmoqda` : "bo'sh"}
        </span>
      </header>

      {words && (
        <div
          role="status"
          aria-live="polite"
          className={
            // An outage is not a warning, it is a wrong count on the screen —
            // so it gets the loud treatment and a passing blip gets the quiet
            // one. Neither is lime: lime says "do this", and there is nothing
            // here for the person at the counter to do.
            state === "lost"
              ? "mb-4 flex items-center gap-3 rounded-card bg-danger-ink px-4 py-4 text-[20px] leading-7 font-semibold text-ink"
              : "mb-4 flex items-center gap-3 rounded-card bg-warn-ink px-4 py-3.5 text-[20px] leading-7 font-medium text-ink"
          }
        >
          <WifiOff className="h-6 w-6 shrink-0" />
          {/* Read from across a counter, so the outage gets the loud treatment
              and a passing blip gets a quiet one. */}
          <span>{words}</span>
        </div>
      )}
    </>
  );
}
