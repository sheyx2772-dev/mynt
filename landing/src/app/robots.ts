import type { MetadataRoute } from "next";

import { absolute } from "@/lib/seo";

// What a crawler may fetch.
//
// Nearly everything: the marketing pages are written to be found, and a
// profile is a page somebody wants strangers to reach — a card is tapped by
// people who have never heard of us, and the same page answering a search is
// the same page doing its job. So the profiles at `/VIP777` are allowed, and
// which of them a crawler ever learns about is decided by what links to them,
// not here. `sitemap.ts` explains that choice at length.
//
// `/p/` is deliberately absent from this list, and that is a decision rather
// than an omission. It is the path `proxy.ts` rewrites a profile onto
// internally; robots.txt is matched against the address that was requested,
// which is always `/VIP777`, so a rule here would never be consulted for a
// profile. Typed directly, `/p/VIP777` falls through to the locale middleware,
// becomes `/uz/p/VIP777` and 404s — there is nothing at that address to keep
// out of an index. What a Disallow line would do is publish the name of the
// internal route in the first file every scraper fetches. If `/p/` ever starts
// answering, the fix is a redirect to the engraved address, not a line here.
//
// The query the number checker leaves behind — `?number=AAA777` — is not
// blocked either. Those addresses are the same page with an answer on it, and
// every one of them carries a canonical without the query, which consolidates
// them. A Disallow would stop a crawler fetching the page and therefore stop
// it reading the canonical, which is the opposite of what it is for.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Doors, not pages. `/login` carries one-time codes in its query and has
      // nothing to index; `/cabinet` is somebody's own data behind a session,
      // and everything a crawler could reach there is a redirect back to the
      // door. Both are listed twice because the language is in the path: the
      // bare form is what the proxy redirects from, `/*/` covers `/uz/login`,
      // `/ru/login` and `/en/login` without naming the locales — a fourth
      // language must not silently open a door.
      disallow: ["/login", "/*/login", "/cabinet", "/*/cabinet", "/api/"],
    },
    sitemap: absolute("/sitemap.xml"),
  };
}
