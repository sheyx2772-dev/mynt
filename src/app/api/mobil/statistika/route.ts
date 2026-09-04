import { getHandleStats } from "@/lib/analytics";
import { requireOwner } from "@/lib/mobil";

// What a number did: visits, clicks, and where the visits arrived from.
//
// This one has no alternative. `handle_stats`, `handle_link_stats` and
// `handle_source_stats` are revoked from `anon` and `authenticated` — 0005 and
// 0018 — because the rows behind them carry visitor hashes and referrers that
// belong to the owner alone. They answer only to the service role, which lives
// on the server and stays there.
//
// Which makes the ownership check above the whole security of this route:
// `getHandleStats` trusts its caller to have done it, and says so.

export const dynamic = "force-dynamic";

const MAX_DAYS = 90;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const check = await requireOwner(request, url.searchParams.get("raqam"));
  if (!check.ok) return check.response;

  // A window the caller chooses, bounded by what the charts can draw and by
  // what one query should scan. Anything unparseable falls back to a month.
  const asked = Number(url.searchParams.get("kun"));
  const days = Number.isFinite(asked) ? Math.min(Math.max(Math.trunc(asked), 1), MAX_DAYS) : 30;

  const stats = await getHandleStats(check.context.normalized, days);

  return Response.json({ stats });
}
