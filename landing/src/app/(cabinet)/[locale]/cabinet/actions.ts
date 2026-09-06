"use server";

import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { asReader } from "@/lib/backend/reader";
import { SESSION_COOKIE } from "@/lib/backend/session";

// Leaving.
//
// Two things have to happen and the order matters. The backend is told first,
// so the token stops working everywhere it might be cached; then the browser
// is told to forget it. Told the other way round, a failed backend call would
// leave a valid token nobody can revoke — the browser has forgotten it, the
// server has not.
//
// Other devices keep their sessions: `/chiqish` is "this device", which is
// what somebody pressing a button on their phone means.
export async function signOut(): Promise<void> {
  const { api } = await asReader();
  try {
    await api.POST("/chiqish", {});
  } catch (cause) {
    // Not a reason to keep somebody signed in. Logged; the cookie still goes.
    console.error("cabinet: sign-out not confirmed by backend", cause);
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect({ href: "/", locale: await getLocale() });
}
