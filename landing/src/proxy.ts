import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed `middleware.ts` to `proxy.ts`.
//
// It used to refresh a Supabase token on every request and write the rotated
// cookies back. There is nothing to rotate now: the session is an opaque token
// the backend issued, it is checked there on every call, and it does not expire
// under the reader mid-visit.
//
// What runs here instead is the work that has to happen before a byte of the
// page is sent. The profile route streams — it has a loading.tsx, so its shell
// is flushed with a 200 long before the page function reaches `notFound()` or
// `permanentRedirect()`. That made every typo a soft 404 and every lowercase
// link a meta-refresh, both of which a crawler re-visits forever. Deciding it
// here decides it before anything streams.

/**
 * The single-segment paths that belong to the site rather than to a handle.
 *
 * The root path is the number namespace, so anything not on this list is read
 * as somebody's handle. A route added under src/app without being added here
 * would be answered with a 404, which is why `proxy.test.ts` reads the routes
 * off the filesystem and fails when the two disagree.
 */
export const RESERVED = new Set([
  "api",
  "biznes",
  "buyurtma",
  "chiqish",
  "kabinet",
  "katalog",
  "kirish",
  "lenta",
  "mavzular",
  "oflayn",
  "qurilmalar",
  "rezidentlar",
  "shartlar",
  "shaxsiy",
  "tarif",
  "x",
  "z",
  // Served from the root but written by hand or by a route handler, so they
  // are not directories under src/app.
  "manifest.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "sw.js",
  "topilmadi",
]);

const HANDLE = /^[A-Za-z]{3}\d{3}$/;
const SERIAL = /^\d{6}$/;

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (segments.length === 1 && first && !RESERVED.has(first)) {
    if (HANDLE.test(first)) {
      // A card, a QR code and the sitemap all carry the uppercase form, and the
      // Genesis list used to link the lowercase one. One address, reached by a
      // redirect the crawler can follow once and remember.
      const upper = first.toUpperCase();
      if (first !== upper) {
        const url = request.nextUrl.clone();
        url.pathname = `/${upper}`;
        return NextResponse.redirect(url, 308);
      }
    } else if (!SERIAL.test(first)) {
      // Neither a handle nor a serial: nothing here, said with the status that
      // means it. Rewritten rather than redirected so the address the visitor
      // typed stays in the bar.
      const url = request.nextUrl.clone();
      url.pathname = "/topilmadi";
      return NextResponse.rewrite(url);
    }
  }

  // The root layout decides <html lang> and cannot see searchParams, so a page
  // opened with ?til=ru rendered Russian text inside lang="uz". The choice
  // travels as a request header instead, which getLang() reads first.
  const til = searchParams.get("til");
  if (!til) return NextResponse.next({ request });

  const headers = new Headers(request.headers);
  headers.set("x-til", til);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Skip static assets and image optimization.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
