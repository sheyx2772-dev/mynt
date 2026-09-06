"use server";

import { hasLocale } from "next-intl";

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { backend } from "@/lib/backend/client";
import { startSession } from "@/lib/backend/session";
import { MIN_PHONE_DIGITS, phoneDigits } from "@/lib/phone";
import { parseHandle } from "@/lib/pricing";

// The one door, and it is the number.
//
// No password, no email, no magic link: an SMS code to a phone. It is what
// everybody here has, what every payment app in this market signs in with, and
// the same door the app uses — so one person is one account whichever of the
// two they opened. Email stood underneath it on the site this replaces and was
// removed on purpose: two doors are two ways for one person to end up with two
// accounts.
//
// There is no separate sign-up. The backend creates an account for a number it
// has never seen, which is not a shortcut — it is what stops this page from
// answering the question "does this number have an account here?". Nothing on
// the page can tell the two cases apart because nothing on the server does.

/** Where somebody lands once they are in. */
const AFTER_SIGN_IN = "/cabinet";

/**
 * What went wrong, as something the page can translate.
 *
 * A code rather than a sentence: this form is rendered in three languages and
 * the words belong in the message files. It is also the only thing the caller
 * is told — the backend's status, its problem document and whatever the socket
 * said stay in the server's log. A sign-in form that prints "connect
 * ECONNREFUSED 10.0.0.4:8090" has mapped our network for whoever asked it to.
 */
export type AskState = {
  error?: "phone" | "send";
  /** The number a code went to, and when, so the page can start a countdown. */
  sent?: { phone: string; at: number; code?: string };
};

export type ConfirmState = { error?: "code" | "server" };

/**
 * Send a code to a number.
 *
 * The answer is the same whether a code went out, the number has no account,
 * or the backend refused it for rate limiting — the backend answers 202 to all
 * three, and this passes that through unchanged. Anything else would turn the
 * form into a way of asking which numbers are registered here, one submission
 * at a time.
 *
 * The one thing that is said plainly is that the string cannot be a phone
 * number at all. That is a statement about what the reader just typed, not
 * about anything we store, so it tells a guesser nothing and saves everybody
 * else a wasted minute waiting for an SMS that was never addressed anywhere.
 */
export async function requestCode(
  previous: AskState,
  form: FormData,
): Promise<AskState> {
  // A code that was already sent survives a failed resend. Without it, one
  // refused retry throws the reader back to the first step and the code
  // sitting in their messages becomes unusable.
  const sent = previous.sent;

  const phone = phoneDigits(String(form.get("phone") ?? ""));
  if (phone.length < MIN_PHONE_DIGITS) return { error: "phone", sent };

  let development: string | undefined;
  try {
    const { data, error, response } = await backend.POST("/kirish/telefon", {
      body: { telefon: phone },
    });
    if (error) {
      return { error: response.status === 422 ? "phone" : "send", sent };
    }
    development = devCode(data?.kod);
  } catch (cause) {
    console.error("sign-in: code not requested", cause);
    return { error: "send", sent };
  }

  return { sent: { phone, at: Date.now(), code: development } };
}

/**
 * TEMPORARY. The code, but only where no SMS can possibly be sent.
 *
 * DELETE THIS FUNCTION AND ITS CALLER when Eskiz is configured. It exists
 * because the product cannot be signed into at all today: the SMS provider has
 * no credentials, and the live backend's code endpoint is deliberately walled
 * off from the internet by Traefik, so nobody can get past the first screen to
 * look at anything behind it.
 *
 * Two conditions have to hold at once and both are load-bearing:
 *
 *   - the BACKEND only puts `kod` in the body when it is running in
 *     development AND has no SMS provider. A configured backend never sends
 *     it, so there is nothing here to leak.
 *   - this SITE only reads it outside a production build. A production bundle
 *     that somehow reached a development backend still shows nothing.
 *
 * That second check is the one that matters, because it is the one under our
 * control at deploy time. The first could be changed by a backend release; the
 * second cannot be changed by anything but editing this file.
 *
 * Even so it is a code on a screen, which is a code anybody standing behind
 * the reader can read. The site this replaces put it in a toast and people
 * learned to rely on it. It goes the day SMS works.
 */
function devCode(kod: string | undefined): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  return kod && /^[0-9]{6}$/.test(kod) ? kod : undefined;
}

/**
 * Spend a code and start a session.
 *
 * One message for a wrong code, an expired one, one already spent, one guessed
 * at three times, and a number with no account — five facts, one sentence.
 * Telling them apart tells somebody guessing which half of the guess was right,
 * which is the whole value of a six-digit secret. The backend already collapses
 * them into a single 401; this must not undo that by reading the status.
 *
 * `phone` arrives from the form, and that is safe because it is not a claim
 * about who is signing in — it is half of a pair the backend checks against a
 * code it hashed itself. Identity is what the backend answers with, never what
 * the form said.
 */
export async function confirmCode(
  _previous: ConfirmState,
  form: FormData,
): Promise<ConfirmState> {
  const phone = phoneDigits(String(form.get("phone") ?? ""));
  const code = phoneDigits(String(form.get("code") ?? "")).slice(0, 6);
  if (phone.length < MIN_PHONE_DIGITS || code.length !== 6) {
    return { error: "code" };
  }

  const result = await sessionFor(phone, code);
  if (!result.ok) return { error: result.error };

  await startSession(result.token);

  // Outside the branch above, because `redirect` works by throwing: called
  // inside a `try` it is caught as a failure and the person is told their code
  // was wrong immediately after it was accepted.
  // `return`, though `redirect` never comes back: it is destructured out of
  // `createNavigation`, so the compiler cannot see the `never` and would call
  // this function's last branch missing.
  return redirect({ href: destination(form), locale: languageOf(form) });
}

/**
 * The session token, or which of two things to say instead.
 *
 * A tagged result rather than "a string means it worked". The first version of
 * this returned the token OR the words "code" / "server", and the caller told
 * them apart with `typeof === "string"` — which is true of all three. So a
 * wrong code was written into the session cookie as the literal text `code`,
 * the reader was sent to the cabinet, the cabinet found no account behind that
 * cookie and sent them back to sign in, and the form they landed on was the
 * first step with the number cleared. One wrong digit looked like the site
 * losing its place, and the "wrong code" message was never on screen long
 * enough to read.
 */
type SessionResult =
  { ok: true; token: string } | { ok: false; error: "code" | "server" };

async function sessionFor(phone: string, code: string): Promise<SessionResult> {
  try {
    const { data, error } = await backend.POST("/kirish/telefon/tasdiq", {
      body: { telefon: phone, kod: code },
    });
    if (error || !data?.token) return { ok: false, error: "code" };
    return { ok: true, token: data.token };
  } catch (cause) {
    // Not an answer about the code. Saying "wrong code" here would send
    // somebody to ask for a new one they also cannot spend, so the backend
    // being unreachable gets its own sentence — and the reason it is
    // unreachable stays in the log.
    console.error("sign-in: backend unreachable", cause);
    return { ok: false, error: "server" };
  }
}

/**
 * Where to go next.
 *
 * Not a path from the query string. The order step sends `?number=AAA777` and
 * the header sends nothing at all, so no caller needs to name a destination —
 * and a sign-in page that redirects to a path a stranger chose is the standard
 * way of dressing somebody else's site up in ours. The destination is a
 * constant here, and the only thing carried across is the number, rebuilt from
 * the three letters and three digits it parsed into.
 */
function destination(form: FormData) {
  const chosen = parseHandle(String(form.get("number") ?? ""));
  return {
    pathname: AFTER_SIGN_IN,
    ...(chosen
      ? { query: { number: `${chosen.letters}${chosen.digits}` } }
      : {}),
  };
}

/**
 * Which language to land in.
 *
 * From the form, because a Server Action has no route segment to read it from
 * — the language lives in the path of the page, and the action is a POST to an
 * endpoint that has none. It is matched against the site's own list rather than
 * pasted into a path, so the worst a forged field can do is send somebody to
 * their own default language.
 */
function languageOf(form: FormData) {
  const asked = form.get("language");
  return hasLocale(routing.locales, asked) ? asked : routing.defaultLocale;
}
