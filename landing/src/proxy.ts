import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

// Next 16 renamed `middleware.ts` to `proxy.ts`. It is the same hook.
//
// This is what makes a bare path work. A card printed with `arend.uz/AAA777`,
// a link somebody sent last month, a deep link in the app — none of them carry
// a language, and all of them must arrive somewhere. This reads the cookie, or
// `Accept-Language` on a first visit, and sends them to their own.
const withLocale = createMiddleware(routing);

/**
 * A number, and only a number: three letters then three digits.
 *
 * Site pages are lower-case words, so the two shapes cannot collide however
 * many pages are added — which is why the profile can live at the root at all.
 */
const HANDLE = /^\/([A-Za-z]{3}[0-9]{3})\/?$/;

/**
 * Where the profile is actually rendered.
 *
 * The address is `/VIP777` because that is what is engraved on the card, and
 * plastic does not take an edit. The route is `/p/[handle]` because `/VIP777`
 * and `/uz` are both one segment, and two dynamic segments with different
 * names in the same position is a route Next refuses to build — a route group
 * gives two branches different chrome, not different URL shapes. So the
 * engraved address is rewritten onto a static first segment here.
 *
 * These two must never be allowed to drift apart. The reader, the address bar,
 * the canonical tag in `generateMetadata` and every link printed on a card all
 * say `/VIP777`; `/p/VIP777` is an implementation detail of this file and
 * appears nowhere else. Moving the route means changing this constant and the
 * canonical together, or the site starts publishing two addresses for one page,
 * which is the duplicate every other decision here exists to avoid.
 *
 * `/p/VIP777` typed directly is not that second address: it does not match
 * HANDLE, so it falls through to the locale middleware, becomes
 * `/uz/p/VIP777`, and 404s like any other path the site has no page for.
 */
const PROFILE_ROUTE = "/p";

export default function proxy(request: NextRequest) {
  const match = HANDLE.exec(request.nextUrl.pathname);

  if (match) {
    // A card is engraved with `arend.uz/VIP777` and plastic does not take an
    // edit. Sent through the locale middleware it would redirect to
    // `/uz/VIP777` on every tap — an extra hop for every stranger, and the
    // printed address would stop being the real one. The language of a profile
    // comes from whoever is holding the phone; see `i18n/request.ts`.
    const handle = match[1].toUpperCase();

    // Cards, QR codes and the sitemap all carry the upper-case form, so that
    // is the address, and `/vip777` is sent to it rather than standing beside
    // it as a second page with the same content.
    if (request.nextUrl.pathname !== `/${handle}`) {
      const canonical = request.nextUrl.clone();
      canonical.pathname = `/${handle}`;
      return NextResponse.redirect(canonical, 308);
    }

    // Cloned rather than built from `request.url`: behind the proxy that
    // origin is the container's own `0.0.0.0:3000`, and a rewrite carrying it
    // has already sent this site to an address that exists nowhere once.
    const url = request.nextUrl.clone();
    url.pathname = `${PROFILE_ROUTE}/${handle}`;

    // The number, for the 404 page: `not-found.tsx` cannot read route params
    // and this is the only place the requested address is still known. Set on
    // every profile request, so a header a caller sent under this name is
    // replaced rather than trusted — and the value is the regex match above,
    // upper-cased, which is three letters and three digits or nothing.
    const headers = new Headers(request.headers);
    headers.set("x-flex-handle", handle);

    return NextResponse.rewrite(url, { request: { headers } });
  }

  return withLocale(request);
}

export const config = {
  // Everything except the things that are not pages. `_next` is the build's
  // own output and would be redirected into a locale it has no copy of.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
