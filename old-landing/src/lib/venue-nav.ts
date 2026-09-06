import "server-only";

import { cache } from "react";

import { cookies } from "next/headers";

import { asReader, SESSION_COOKIE } from "@/lib/backend/client";

export type VenueTab = { handle: string; waiting: number };

/**
 * The cabinet's venue tab, or nothing.
 *
 * Nothing is the normal case: most people who own a number do not run a cafe.
 * Memoized for the render pass, because the layout asks on every page.
 */
export const venueTab = cache(async (): Promise<VenueTab | null> => {
  // Cheap first: with no session there is nothing to ask about, and asking
  // anyway put a backend round-trip in front of every page for every visitor
  // and every crawler. The comment in the layout said this already happened;
  // it did not.
  if (!(await cookies()).get(SESSION_COOKIE)) return null;

  const client = await asReader();
  const { data, error } = await client.GET("/men/obyekt", {});
  if (error || !data?.obyekt) return null;

  return { handle: data.obyekt.raqam, waiting: data.obyekt.kutilmoqda };
});
