import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE, backend } from "./client";

// Holding a session, on the website's side.
//
// The backend hands back both a Set-Cookie header and the token in the body.
// The header is for a client talking to it directly — the phone, curl. This
// server is a third party in the middle: the browser's cookie has to be set on
// *our* response, not on the one we received. So the token is taken from the
// body and written here.

/** A session's lifetime, matching the backend's. */
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function startSession(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Never readable by script. The whole reason this is a cookie rather than
    // localStorage: a cross-site script that finds a token in localStorage has
    // the account, and one that finds this cookie has nothing.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/**
 * Spends a one-time sign-in link and starts the session it returns.
 *
 * Returns whether it worked and nothing else. An expired link, a spent link
 * and an invented one are one answer on purpose — the person is told to ask
 * for a new one either way, and the difference is only useful to somebody
 * trying tokens.
 */
export async function consumeLink(token: string): Promise<boolean> {
  const { data, error } = await backend.POST("/kirish/tasdiq", { body: { token } });
  if (error || !data?.token) return false;

  await startSession(data.token);
  return true;
}

