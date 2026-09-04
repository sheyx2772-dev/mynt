// Is the server reachable from where this phone is standing.
//
// The counter screen needs an answer it can test, and `router.refresh()` gives
// it none: a refresh that fails during an outage resolves quietly and leaves the
// old list on screen. So the phone asks this first, and only refreshes when
// something answered.
//
// Deliberately tiny and deliberately uncached. It carries no data, touches no
// database and reveals nothing — which is why it needs no token, on a route a
// phone with a public staff link can already reach.

export const dynamic = "force-dynamic";

export function GET(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      // Any cache between here and the till would answer for the server after
      // it stopped answering, which is the failure this route exists to detect.
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
