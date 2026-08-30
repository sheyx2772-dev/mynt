import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Visits are counted without keeping anything that identifies the visitor.
// The hash below mixes the day, a server secret, the address and the user
// agent: it distinguishes repeat visits within a day and is worthless
// afterwards, since tomorrow the same person hashes to something else.
//
// The salt matters. A bare hash of an IPv4 address is reversible by trying
// all four billion of them.
const salt = process.env.ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export type VisitorContext = {
  visitorHash: string | null;
  referrerHost: string | null;
};

export async function readVisitorContext(): Promise<VisitorContext> {
  const h = await headers();

  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
  const agent = h.get("user-agent") ?? "";

  const visitorHash =
    ip || agent
      ? createHash("sha256")
          .update(`${new Date().toISOString().slice(0, 10)}|${salt}|${ip}|${agent}`)
          .digest("hex")
          .slice(0, 32)
      : null;

  // Only the host: a full referring URL can carry query parameters that are
  // none of our business.
  let referrerHost: string | null = null;
  const referer = h.get("referer");
  if (referer) {
    try {
      referrerHost = new URL(referer).host || null;
    } catch {
      referrerHost = null;
    }
  }

  return { visitorHash, referrerHost };
}

export async function recordProfileView(handle: string, context: VisitorContext): Promise<void> {
  if (!supabaseAdmin) return;

  // Analytics must never be the reason a profile fails to load.
  try {
    await supabaseAdmin.from("profile_views").insert({
      handle,
      visitor_hash: context.visitorHash,
      referrer_host: context.referrerHost,
    });
  } catch {
    // Swallowed deliberately.
  }
}

export async function recordLinkClick(
  handle: string,
  label: string,
  context: VisitorContext
): Promise<void> {
  if (!supabaseAdmin) return;

  try {
    await supabaseAdmin.from("link_clicks").insert({
      handle,
      label,
      visitor_hash: context.visitorHash,
    });
  } catch {
    // Swallowed deliberately.
  }
}

export type DailyStat = { day: string; views: number; clicks: number; visitors: number };
export type LinkStat = { label: string; clicks: number };

export type HandleStats = {
  daily: DailyStat[];
  links: LinkStat[];
  totalViews: number;
  totalClicks: number;
  totalVisitors: number;
};

// Callers must have already established that the viewer owns the handle.
export async function getHandleStats(handle: string, days = 30): Promise<HandleStats> {
  const empty: HandleStats = {
    daily: [],
    links: [],
    totalViews: 0,
    totalClicks: 0,
    totalVisitors: 0,
  };
  if (!supabaseAdmin) return empty;

  const [daily, links] = await Promise.all([
    supabaseAdmin.rpc("handle_stats", { p_handle: handle, p_days: days }),
    supabaseAdmin.rpc("handle_link_stats", { p_handle: handle, p_days: days }),
  ]);

  if (daily.error || !daily.data) return empty;

  const series: DailyStat[] = daily.data.map((row: Record<string, unknown>) => ({
    day: String(row.day),
    views: Number(row.views),
    clicks: Number(row.clicks),
    visitors: Number(row.visitors),
  }));

  return {
    daily: series,
    links: (links.data ?? []).map((row: Record<string, unknown>) => ({
      label: String(row.label),
      clicks: Number(row.clicks),
    })),
    totalViews: series.reduce((sum, d) => sum + d.views, 0),
    totalClicks: series.reduce((sum, d) => sum + d.clicks, 0),
    // Unique visitors are unique per day, so the total is an upper bound on
    // distinct people, not a distinct count across the whole window.
    totalVisitors: series.reduce((sum, d) => sum + d.visitors, 0),
  };
}
