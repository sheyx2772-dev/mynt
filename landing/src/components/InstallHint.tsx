"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Share, X, Download } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void> };

const DISMISSED_KEY = "flex.install-hint.dismissed";

// Whether to offer installation is a question about the browser and about a
// stored preference — both external to React. Reading them through a store
// keeps it out of an effect (which would cost a second render) and out of the
// render body (which would disagree with the server and break hydration).

type Hint = "hidden" | "ios" | "eligible";

const listeners = new Set<() => void>();

let dismissed: boolean | null = null;
let cachedHint: Hint | null = null;

function isDismissed(): boolean {
  if (dismissed === null) {
    try {
      dismissed = Boolean(localStorage.getItem(DISMISSED_KEY));
    } catch {
      // Private mode can throw on access; treat it as not dismissed.
      dismissed = false;
    }
  }
  return dismissed;
}

function dismissForever() {
  dismissed = true;
  cachedHint = "hidden";
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Nothing to do; the hint simply returns on the next visit.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// getSnapshot is called on every render, so the answer is computed once and
// reused — returning a fresh value each time would loop.
function getSnapshot(): Hint {
  if (cachedHint !== null) return cachedHint;

  if (isDismissed()) return (cachedHint = "hidden");

  const installed =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone));

  if (installed) return (cachedHint = "hidden");

  // Safari on iOS never fires `beforeinstallprompt` and cannot be prompted
  // programmatically, so there the only option is to describe the Share menu.
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return (cachedHint = isIos ? "ios" : "eligible");
}

// The server has no browser to ask, so it renders nothing and the real answer
// arrives on the client.
const getServerSnapshot = (): Hint => "hidden";

export default function InstallHint() {
  const hint = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);

  useEffect(() => {
    // Chromium fires this only when the app is installable and not already
    // installed. Setting state from a listener is a subscription, not a
    // cascading render.
    function onPrompt(event: Event) {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const showIos = hint === "ios";
  const showButton = hint === "eligible" && prompt !== null;

  if (!showIos && !showButton) return null;

  return (
    <div className="relative mb-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4 pr-10">
      <button
        onClick={dismissForever}
        aria-label="Yopish"
        className="absolute top-3 right-3 text-flex-black/30 transition-colors hover:text-flex-black/60"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="text-sm font-medium">Flex&apos;ni telefoningizga o&apos;rnating</p>

      {showIos ? (
        <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-flex-black/55">
          Safari&apos;da
          <Share className="inline h-3.5 w-3.5" />
          tugmasini bosing, so&apos;ng
          <span className="font-medium text-flex-black/75">&quot;Add to Home Screen&quot;</span>
          ni tanlang.
        </p>
      ) : (
        <>
          <p className="mt-1.5 text-xs text-flex-black/55">
            Bosh ekrandan bir bosishda ochiladi va internetsiz ham yuklanadi.
          </p>
          <button
            onClick={async () => {
              await prompt?.prompt();
              setPrompt(null);
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-flex-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-flex-black/85"
          >
            <Download className="h-3.5 w-3.5" />
            O&apos;rnatish
          </button>
        </>
      )}
    </div>
  );
}
