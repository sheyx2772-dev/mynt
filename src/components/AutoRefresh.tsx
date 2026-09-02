"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// A screen that is left open on a counter.
//
// The requests on it arrive while nobody is touching the phone, so a page that
// only updates when somebody pulls it down is the same as no page. This asks
// the server for the current list on a timer, and stops while the tab is in the
// background — a phone face-down in an apron does not need to poll.

export default function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.hidden) return;
      router.refresh();
    };

    const timer = setInterval(tick, seconds * 1000);

    // Coming back to the tab is exactly the moment the list is most stale.
    const wake = () => {
      if (!document.hidden) router.refresh();
    };
    document.addEventListener("visibilitychange", wake);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [router, seconds]);

  return null;
}
