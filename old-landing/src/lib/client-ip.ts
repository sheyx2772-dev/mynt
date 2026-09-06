import "server-only";

import { headers } from "next/headers";

/**
 * Best-effort client address, for the few places that still want one.
 *
 * The rate limits themselves moved to the backend, which counts attempts where
 * they are actually made — a cap enforced in the browser's server is a cap
 * enforced somewhere the attempts are not counted.
 *
 * Behind a proxy the left-most entry of `x-forwarded-for` is the original
 * client; falls back to null when nothing is trustworthy.
 */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim() || null;
  return h.get("x-real-ip");
}
