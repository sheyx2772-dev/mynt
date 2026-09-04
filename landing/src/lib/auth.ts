import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

// Memoized for the render pass so a page can ask for the user in several
// places without re-validating the token each time.
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  // getUser() re-validates the JWT against Supabase. Never trust getSession()
  // on the server — it only decodes the cookie without verifying it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
});

// Use in Server Actions and protected pages: returns the user or bails out.
export async function requireUser(returnTo?: string): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect(returnTo ? `/kirish?keyin=${encodeURIComponent(returnTo)}` : "/kirish");
  }
  return user;
}
