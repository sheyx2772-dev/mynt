import "server-only";

import { headers } from "next/headers";

// Canonical production origin. Everything that builds an absolute link starts
// from here, and it never comes from a request.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://flex.com.uz").replace(/\/$/, "");

// A request's Host and X-Forwarded-Host headers are set by whoever sent the
// request. Reading an origin from them lets an attacker post a sign-in form
// with someone else's address and a forged host, so the one-time link that
// arrives in that person's inbox points at the attacker's server — the token
// is handed over and the account with it.
//
// So the header is only consulted for local development, where there is no
// deployment to impersonate, and only for hosts that cannot be anything else.
function isLocalHost(host: string): boolean {
  const name = host.split(":")[0];
  return name === "localhost" || name === "127.0.0.1" || name === "[::1]";
}

export async function getSiteOrigin(): Promise<string> {
  // Configured deployments never look at a header at all.
  if (process.env.NEXT_PUBLIC_SITE_URL) return SITE_URL;

  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").trim();

  if (host && isLocalHost(host)) return `http://${host}`;

  // Unset in production, or a host we do not recognise: fall back to the
  // canonical origin rather than trusting what the request claimed to be.
  return SITE_URL;
}

/**
 * A profile's address, optionally carrying where the visit came from.
 *
 * The devices and the QR code are issued with a source so the owner can see
 * whether the card they paid for is what brings people, rather than seeing a
 * direct visit that could equally be somebody typing the address.
 */
export function profileUrl(handle: string, source?: "nfc" | "qr" | "share"): string {
  return source ? `${SITE_URL}/${handle}?src=${source}` : `${SITE_URL}/${handle}`;
}
