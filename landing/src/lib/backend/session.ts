import "server-only";

import { cookies } from "next/headers";

// Holding a session, on the website's side.
//
// The backend answers `/kirish/telefon/tasdiq` with both a `Set-Cookie` header
// and the token in the body. The header is for a client talking to it directly
// — the phone, curl. This server is a third party in the middle: it made the
// request, so the header lands on a response the browser will never see. The
// cookie has to be set on *our* response, which is what this file does.
//
// It is a cookie and not `localStorage`, and that is the whole security
// decision on this page. A token in `localStorage` is readable by every script
// the page ever loads, so one cross-site scripting bug anywhere on the site —
// a profile field rendered wrong, a third-party tag — walks off with the
// account and keeps it for thirty days. `httpOnly` puts the token somewhere
// script cannot reach at all: the same bug then gets nothing, because the
// browser attaches the cookie itself and never hands it over. It also never
// reaches a client component, which is why the token is read here and nowhere
// else.

/** The cookie the Go backend issues, and the only credential this site holds. */
export const SESSION_COOKIE = "flex_session";

/** Matches `auth.SessionLifetime` in the backend. */
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function startSession(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // `lax` rather than `strict`: a person arrives here from a link in a chat
    // app or from the order step on another tab, and `strict` drops the cookie
    // on exactly that hop — they would land signed in and be shown a sign-in
    // form. `lax` still refuses to attach it to a cross-site POST, which is
    // what a forged request would be.
    sameSite: "lax",
    // Never sent over plain HTTP, so a session cannot be lifted off a café
    // network. Development is the exception because there is no certificate
    // there and the cookie would otherwise never be stored at all.
    secure: process.env.NODE_ENV === "production",
    // The whole site, because the profile, the cabinet and this page are all
    // one session.
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}
