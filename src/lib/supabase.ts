import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Public client: respects Row Level Security, safe for read-only lookups.
export const supabase = isSupabaseConfigured ? createClient(url!, anonKey!) : null;

// Admin client: bypasses RLS via the service_role key. Server-only — never
// import this from a "use client" component.
export const supabaseAdmin =
  isSupabaseConfigured && serviceRoleKey ? createClient(url!, serviceRoleKey) : null;
