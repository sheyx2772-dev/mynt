import "server-only";

import { cookies } from "next/headers";
import createClient from "openapi-fetch";

import { BACKEND_URL } from "./client";
import type { paths } from "./schema";
import { SESSION_COOKIE } from "./session";

// A client carrying the reader's session.
//
// `backend` in client.ts is anonymous, and the cabinet cannot be: every answer
// it shows is filtered by who is asking. The token lives in an httpOnly cookie
// the browser attaches to requests to *this* server, not to the backend — so it
// is read here and forwarded, and nowhere else.
//
// Built per request rather than once, because the cookie is per request. Next
// forbids reading cookies outside a request scope, and that refusal is what
// makes it impossible for this to become a shared, signed-in client that one
// visitor's page could answer with another visitor's data.
//
// No session, no header: the backend then answers 401, which every caller
// treats as "nobody", and the cabinet sends them to sign in.
export async function asReader() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const headers = token ? { cookie: `${SESSION_COOKIE}=${token}` } : undefined;

  return {
    api: createClient<paths>({ baseUrl: `${BACKEND_URL}/v1`, headers }),
  };
}

export type Reader = Awaited<ReturnType<typeof asReader>>;
