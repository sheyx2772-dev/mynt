import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

// Next 16 renamed `middleware.ts` to `proxy.ts`. It is the same hook.
//
// This is what makes a bare path work. A card printed with `arend.uz/AAA777`,
// a link somebody sent last month, a deep link in the app — none of them carry
// a language, and all of them must arrive somewhere. This reads the cookie, or
// `Accept-Language` on a first visit, and sends them to their own.
export default createMiddleware(routing);

export const config = {
  // Everything except the things that are not pages. `_next` is the build's
  // own output and would be redirected into a locale it has no copy of.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
