import { NextResponse, type NextRequest } from "next/server";

import { consumeLink } from "@/lib/backend/session";
import { safePath } from "@/lib/safe-path";

// Where the emailed sign-in link lands.
//
// The address is the backend's — it is what goes into the mail — so this route
// exists at the path the backend writes rather than at one of our choosing.
//
// The token is spent and forgotten: never stored, never logged, and taken out
// of the address before anything else happens. A token left in a URL is a
// token in the browser history and in whatever the next page's referrer
// carries, and it is worth an account for as long as it lives.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("t");
  const next = safePath(searchParams.get("keyin"));

  if (!token) {
    return NextResponse.redirect(`${origin}/kirish?xato=havola`);
  }

  // Expired, already spent and invented are one answer. The person is told to
  // ask for a new link either way, and the difference is only useful to
  // somebody trying tokens.
  if (!(await consumeLink(token))) {
    return NextResponse.redirect(`${origin}/kirish?xato=havola`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
