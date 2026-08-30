"use client";

import { useEffect } from "react";

// Registers the service worker in the browser. Development is excluded: a
// worker caching build output across hot reloads serves stale code and makes
// every change look like it did not apply.
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // An unregistered worker only costs offline support; the site works.
    });
  }, []);

  return null;
}
