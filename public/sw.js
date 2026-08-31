// Flex service worker.
//
// Two rules, and a deliberate refusal to cache anything else:
//   - Static build output is immutable, so serve it from the cache first.
//   - Pages go to the network; if that fails, show the offline page.
//
// Profile pages are never cached: a handle can be claimed, edited or released
// at any moment, and a stale profile is worse than an honest offline notice.
// Nothing under /api, /auth or /kabinet is cached either — those carry
// session state or money.

const VERSION = "v1";
const SHELL = `flex-shell-${VERSION}`;
const STATIC = `flex-static-${VERSION}`;
const OFFLINE_URL = "/oflayn";

const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL && k !== STATIC).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isPrivate(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/kabinet") ||
    url.pathname === "/kirish" ||
    url.pathname === "/chiqish"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only plain GETs are ever served from a cache; a POST is always a mutation.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isPrivate(url)) return;

  // Immutable build output.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(STATIC).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  // Navigations: network first, offline page as the fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((hit) => hit ?? Response.error())
      )
    );
  }
});
