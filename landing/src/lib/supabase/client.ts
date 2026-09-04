"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./config";

// Browser client. Reads and writes the auth cookies that `proxy.ts` keeps
// fresh, so the session survives navigation and server rendering.
export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase sozlanmagan — .env.local faylini tekshiring.");
  }
  return createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
}
