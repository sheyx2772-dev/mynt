"use client";

import { useEffect, useState } from "react";

/**
 * Seconds left, counted against the clock rather than by ticks.
 *
 * A counter that subtracts one per interval is wrong on a phone, which is the
 * only device that matters here: the tab is backgrounded the moment somebody
 * opens their messages to read the code, timers there are throttled to
 * whatever the browser feels like, and the button comes back late by however
 * long they were away. Reading the wall clock makes the interval a repaint
 * rather than the measurement.
 *
 * `restart` is read as a change signal and never as a time. It is stamped on
 * the server, and a device whose clock disagrees with the server's by ten
 * minutes would otherwise be told to wait ten minutes for a code it already
 * has. Both ends of the subtraction come from the same clock here.
 */
export default function useCountdown(restart: number, seconds: number): number {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const until = Date.now() + seconds * 1000;

    function tick() {
      const rest = Math.ceil((until - Date.now()) / 1000);
      setLeft(rest > 0 ? rest : 0);
      return rest;
    }

    if (tick() <= 0) return;

    const timer = setInterval(() => {
      if (tick() <= 0) clearInterval(timer);
    }, 500);
    return () => clearInterval(timer);
  }, [restart, seconds]);

  return left;
}
