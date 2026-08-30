import "server-only";

import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Claims are cheap to attempt and expensive to undo, so they're capped twice:
// per account (stops one user hoarding) and per IP (stops one script driving
// many throwaway accounts). Both windows are one hour.
const PER_USER_PER_HOUR = 5;
const PER_IP_PER_HOUR = 15;
const WINDOW_MS = 60 * 60 * 1000;

// Best-effort client IP. Behind a proxy the left-most entry of x-forwarded-for
// is the original client; falls back to null when nothing is trustworthy.
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim() || null;
  return h.get("x-real-ip");
}

export type RateLimitVerdict = { allowed: true } | { allowed: false; reason: string };

export async function checkClaimRateLimit(
  userId: string,
  ip: string | null
): Promise<RateLimitVerdict> {
  if (!supabaseAdmin) return { allowed: true };

  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { count: userCount } = await supabaseAdmin
    .from("claim_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if ((userCount ?? 0) >= PER_USER_PER_HOUR) {
    return {
      allowed: false,
      reason: "Bir soatda juda ko'p urinish. Birozdan so'ng qayta urining.",
    };
  }

  if (ip) {
    const { count: ipCount } = await supabaseAdmin
      .from("claim_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", since);

    if ((ipCount ?? 0) >= PER_IP_PER_HOUR) {
      return {
        allowed: false,
        reason: "Bir soatda juda ko'p urinish. Birozdan so'ng qayta urining.",
      };
    }
  }

  return { allowed: true };
}

export async function recordClaimAttempt(
  userId: string,
  ip: string | null,
  handle: string,
  succeeded: boolean
): Promise<void> {
  if (!supabaseAdmin) return;
  // Logging must never break a claim that otherwise succeeded.
  await supabaseAdmin.from("claim_attempts").insert({ user_id: userId, ip, handle, succeeded });
}
