import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed `middleware.ts` to `proxy.ts`.
//
// It used to refresh a Supabase token on every request and write the rotated
// cookies back. There is nothing to rotate now: the session is an opaque token
// the backend issued, it is checked there on every call, and it does not expire
// under the reader mid-visit — so the request passes straight through.
//
// The file stays because the matcher is still worth having the day something
// does belong here. Nothing runs per request that does not have to.
export function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  // Skip static assets and image optimization.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
