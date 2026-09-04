import "server-only";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, isSupabaseConfigured } from "./config";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Bypasses Row Level Security. Only reach for this when the operation is
// genuinely privileged (writing a claim after auth + validation have passed).
// `server-only` makes importing it from a client component a build error.
export const supabaseAdmin =
  isSupabaseConfigured && serviceRoleKey
    ? createClient(SUPABASE_URL!, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
