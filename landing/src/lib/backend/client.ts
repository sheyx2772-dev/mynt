import "server-only";

import { cookies } from "next/headers";
import createClient from "openapi-fetch";

import type { paths } from "./schema";

// The one way this site talks to its own backend.
//
// Typed from the backend's OpenAPI document by `npm run api`, so a field
// renamed in Go breaks `npm run typecheck` here rather than a page in front of
// somebody. That is the whole reason the backend publishes a specification.
//
// This replaces the Supabase client. The difference that matters is not which
// library: it is that the browser no longer holds a key that can read the
// database. Every decision — who owns a number, what a plan allows, whether a
// profile may be edited — is made in Go, and this file only asks.

/** Where the backend is. Same origin in production, behind a proxy in dev. */
export const BACKEND_URL = (
  // Empty falls back as unset does — see site-url.ts for what `??` cost here.
  // This one would be worse: an empty BACKEND_URL sends every request to
  // 127.0.0.1 inside the site's own container, where nothing is listening, and
  // every page fails for a reason that names neither the setting nor the
  // backend.
  process.env.BACKEND_URL?.trim() || "http://127.0.0.1:8090"
).replace(/\/$/, "");

/** The cookie the Go backend sets, and the only credential this site holds. */
export const SESSION_COOKIE = "flex_session";

/** Calls that need nobody signed in: a public profile, a price. */
export const backend = createClient<paths>({ baseUrl: `${BACKEND_URL}/v1` });

/**
 * A client carrying the reader's session.
 *
 * Built per request rather than once, because the cookie is per request. Next
 * forbids reading cookies outside a request scope, which is the compiler
 * telling us this cannot accidentally become a shared, signed-in client.
 */
export async function asReader(): Promise<Reader> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  return createClient<paths>({
    baseUrl: `${BACKEND_URL}/v1`,
    headers: token ? { cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

/**
 * A client that already holds the reader's session.
 *
 * Worth naming because of `after()`. Work deferred until the response has been
 * sent runs outside the request, where `cookies()` throws — so anything that
 * happens there has to be handed a client built while the request was still
 * open, rather than building its own. Taking one as an argument is what makes
 * that a type error instead of a line in a log nobody reads.
 */
export type Reader = ReturnType<typeof createClient<paths>>;
