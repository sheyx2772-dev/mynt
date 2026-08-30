import "server-only";

import { headers } from "next/headers";

// Absolute origin for links that leave the app and come back (magic links).
// Prefers the configured public URL; falls back to the request's own host so
// local development and preview deploys work without extra configuration.
export async function getSiteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocol = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
