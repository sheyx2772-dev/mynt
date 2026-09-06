import { NextResponse } from "next/server";

// Sending somebody to another path on this site.
//
// `NextResponse.redirect()` needs an absolute URL, and every caller built one
// the same way — `new URL(path, request.url)`. Behind a proxy that is wrong:
// the request the container sees was addressed to `0.0.0.0:3000`, so the
// browser was told to go to `http://0.0.0.0:3000/…` and got a refused
// connection. It broke signing out, changing language, and following a
// sign-in link — the three places that redirect after doing something, so it
// looked intermittent rather than broken.
//
// Trusting `x-forwarded-host` would fix it and would put a header the caller
// controls into a URL we send them to. A relative `Location` needs no origin
// at all: the browser resolves it against the address it actually used, which
// is the one that reached us. It has been legal since RFC 7231 and every
// browser has done it for far longer.
//
// A NextResponse rather than a plain one so callers can still set cookies —
// the language switch redirects and remembers in the same response.
export function redirectTo(path: string, status: 303 | 307 | 308 = 303) {
  return new NextResponse(null, { status, headers: { Location: path } });
}
