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
const HANDLE = /^\/[A-Za-z]{3}[0-9]{3}\/?$/;

export default function proxy(request: NextRequest) {
  // A card is engraved with `arend.uz/VIP777` and plastic does not take an
  // edit. Sent through the locale middleware it would redirect to
  // `/uz/VIP777` on every tap — an extra hop for every stranger, and the
  // printed address would stop being the real one. The language of a profile
  // comes from whoever is holding the phone; see `i18n/request.ts`.
  if (HANDLE.test(request.nextUrl.pathname)) return NextResponse.next();

  return withLocale(request);
}

export const config = {
  // Everything except the things that are not pages. `_next` is the build's
  // own output and would be redirected into a locale it has no copy of.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
