import "server-only";

import { createClient } from "@supabase/supabase-js";

import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "@/lib/supabase/config";

// Who is asking, when the asker is the phone.
//
// The website authenticates with a cookie that `proxy.ts` keeps fresh, and
// `@/lib/auth` reads it. An app has no cookie jar shared with a browser: it
// holds the session itself and sends the access token in an Authorization
// header, so identity has to be established from that instead.
//
// Everything else about the request stays untrusted. A user id in a body or a
// query string is a claim the sender made about themselves; the only id these
// routes ever act on is the one that comes back from here.

export type BearerUser = { id: string; email: string | null };

/**
 * The user a request's bearer token belongs to, or nothing.
 *
 * `getUser(token)` is a round trip to Supabase, which is the point. The token
 * is a JWT and decoding one locally is easy — and worthless, because a decoder
 * reads the claims of any string shaped like a token, including one somebody
 * wrote themselves. Asking the issuer is what turns "this says it is Aziz"
 * into "this is Aziz". The same reason `@/lib/auth` calls `getUser()` rather
 * than `getSession()`.
 *
 * The cost is one HTTP request per API call. That is the correct price and
 * caching it would be a mistake: a cached answer keeps a signed-out or deleted
 * account working for as long as the entry lives.
 */
export async function userFromBearer(request: Request): Promise<BearerUser | null> {
  if (!isSupabaseConfigured) return null;

  const token = readBearer(request.headers.get("authorization"));
  if (!token) return null;

  // A fresh client per request, with no session of its own. Sharing one would
  // mean sharing whatever the last caller authenticated as.
  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return { id: data.user.id, email: data.user.email ?? null };
}

/**
 * The token out of an Authorization header, if the header is one of ours.
 *
 * The scheme is compared case-insensitively because RFC 7235 says it is
 * case-insensitive, and clients differ. Everything after it is taken as the
 * token and trimmed; nothing here decides whether it is valid.
 */
function readBearer(header: string | null): string | null {
  if (!header) return null;

  const space = header.indexOf(" ");
  if (space < 0) return null;
  if (header.slice(0, space).toLowerCase() !== "bearer") return null;

  const token = header.slice(space + 1).trim();
  return token.length > 0 ? token : null;
}

/** The 401 every mobile route gives, worded the same way each time. */
export function unauthorized(): Response {
  return Response.json({ error: "Avval hisobingizga kiring." }, { status: 401 });
}
