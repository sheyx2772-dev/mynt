import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { asReader } from "@/lib/backend/client";

// Who is reading this page.
//
// This used to ask Supabase. It asks our own backend now, which is the change
// that matters: the session is one the backend issued and can revoke, and it
// is checked by the server that owns the data rather than by a token the
// browser could have been handed by anyone.
//
// The shape is kept — `id`, `email` — because seventy call sites read
// `user.id` and none of them should care where the answer came from.

export type User = {
  id: string;
  email: string;
  /**
   * Only ever the Telegram display name, and only when that is how they
   * signed in. Kept because one page shows it; not a general bag of fields.
   */
  user_metadata?: { telegram_name?: string };
};

// Memoized for the render pass so a page can ask for the user in several
// places without a request each time.
export const getUser = cache(async (): Promise<User | null> => {
  const client = await asReader();

  try {
    // The backend answers 401 for a session it does not recognise — expired,
    // revoked, or never issued. That is an answer, not a fault, so it is not
    // logged and not retried.
    const { data, error } = await client.GET("/men", {});
    if (error || !data?.account?.id) return null;

    return { id: data.account.id, email: data.account.email ?? "" };
  } catch (cause) {
    // A backend that cannot be reached at all — restarting, redeployed,
    // network gone. Every page asks this, including the public profile that a
    // tapped card opens, so throwing here turns a blip into a broken product
    // page for a stranger who has no session anyway.
    //
    // Answering "nobody" is the safe reading: a public page renders as it does
    // for a visitor, and a page that needs an owner redirects to sign-in
    // rather than showing somebody else's data. Logged, because unreachable is
    // not normal and should not be silent.
    console.error("getUser: backend unreachable", cause);
    return null;
  }
});

// Use in Server Actions and protected pages: returns the user or bails out.
export async function requireUser(returnTo?: string): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect(returnTo ? `/kirish?keyin=${encodeURIComponent(returnTo)}` : "/kirish");
  }
  return user;
}
