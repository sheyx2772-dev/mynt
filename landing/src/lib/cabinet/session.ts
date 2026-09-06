import "server-only";

import { cache } from "react";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { asReader } from "@/lib/backend/reader";

// Who is asking.
//
// The only source of identity in the cabinet. A page or an action that needs
// to know who is signed in calls this and nothing else: not a cookie it reads
// itself, not an id in a form field, not a number in the address. The answer
// comes from the backend, which is the one thing that issued the session and
// the one thing that can revoke it.
//
// The join with `/login`: that page sets the `flex_session` cookie via
// `lib/backend/session.ts`; this reads it back through `asReader()`. Neither
// file knows the other exists beyond the cookie's name.

export type Account = { id: string; email: string };

/**
 * The signed-in account, or null.
 *
 * Memoised for the render pass so a layout and the page under it can both ask
 * without two round trips. 401 is an answer — expired, revoked, never issued —
 * and so is an unreachable backend: both read as "nobody", because the safe
 * failure for a cabinet is a sign-in form rather than somebody else's data or
 * a stack trace. The second is logged; the first is Tuesday.
 */
export const currentAccount = cache(async (): Promise<Account | null> => {
  const { api } = await asReader();
  try {
    const { data, error } = await api.GET("/men", {});
    if (error || !data?.account?.id) return null;
    return { id: data.account.id, email: data.account.email ?? "" };
  } catch (cause) {
    console.error("cabinet: backend unreachable", cause);
    return null;
  }
});

/** The account, or the sign-in page. For pages and actions that cannot go on without one. */
export async function requireAccount(): Promise<Account> {
  const account = await currentAccount();
  if (account) return account;
  // `redirect` throws, so nothing below this line runs for a stranger. The
  // sign-in page decides where they land afterwards on its own; it does not
  // take a return path from us or from anyone.
  redirect({ href: "/login", locale: await getLocale() });
  throw new Error("unreachable");
}
