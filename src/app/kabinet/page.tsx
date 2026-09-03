import Link from "next/link";
import { after } from "next/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Bell, Rss, Building2, ChevronRight, Clock } from "lucide-react";

import PageShell from "@/components/PageShell";
import HandleHub from "@/components/HandleHub";
import SignOutButton from "@/components/SignOutButton";
import InstallHint from "@/components/InstallHint";
import IncomingTransfers from "@/components/IncomingTransfers";
import { requireUser } from "@/lib/auth";
import { listHandlesForUser, touchLastSeen } from "@/lib/handles";
import { listNotifications } from "@/lib/notify";
import { listIncomingTransfers } from "@/lib/transfers";
import { getTeamForUser } from "@/lib/teams";
import { getHandleStats } from "@/lib/analytics";
import { listLeads } from "@/lib/leads";
import { getOwnedVenue, countMenuItems } from "@/lib/menu";
import { countWaiting, countAllRequests } from "@/lib/venue-requests";

export const metadata: Metadata = {
  title: "Kabinet — flex.com.uz",
  robots: { index: false },
};

// The screen behind the app icon.
//
// An installed copy opens here, which means this is the first thing an owner
// sees every time — so it shows their number and what it did rather than a list
// of cards they have to tap through to reach anything. Almost everybody owns
// exactly one number; for them the list was a whole screen that existed to hold
// a single row.
//
// With more than one, the extra numbers become a strip above the hub and the
// address remembers which one is open.
export default async function CabinetPage(props: PageProps<"/kabinet">) {
  const { ish } = await props.searchParams;
  const user = await requireUser("/kabinet");

  const [handles, incoming, notifications, team] = await Promise.all([
    listHandlesForUser(user.id),
    listIncomingTransfers(user.email ?? ""),
    listNotifications(user.id),
    getTeamForUser(user.id),
  ]);

  const unread = notifications.filter((n) => !n.readAt).length;

  // Which number this screen is about. The oldest paid-for one, because that is
  // the number somebody's cards are printed with; the newest is usually one
  // they just bought and have not used yet. Every other number they own is a
  // chip above it, and each chip is its own address — /kabinet/TST999 — rather
  // than a query on this one. That was not a style choice: with ?raqam= the
  // chip changed the address and the client router kept serving the payload it
  // already had for /kabinet, so tapping a number did nothing at all.
  const open =
    handles
      .filter((h) => h.status === "claimed")
      .sort((a, b) => (a.claimedAt ?? "").localeCompare(b.claimedAt ?? ""))[0] ??
    handles[0] ??
    null;

  // Only for the number actually on screen. Somebody with six handles should
  // not pay for six sets of statistics to look at one.
  const detail = open
    ? await (async () => {
        const [today, leads, venue] = await Promise.all([
          getHandleStats(open.normalized, 1),
          listLeads(open.normalized, user.id),
          getOwnedVenue(open.normalized, user.id),
        ]);
        return {
          todayViews: today.totalViews,
          leads: leads.length,
          venue,
          waiting: venue ? await countWaiting(venue.id) : 0,
          setup: venue
            ? {
                menuItems: await countMenuItems(venue.id),
                points: venue.points.length,
                hasStaffLink: Boolean(venue.staffToken),
                requests: await countAllRequests(venue.id),
              }
            : null,
        };
      })()
    : null;

  // Arrived from a long-press on the app icon. The shortcut cannot name a
  // number — the person may own none or six — so it names the job, and this is
  // where it learns which card is open. A shortcut that has nowhere to go
  // simply leaves them here, which is the screen they wanted anyway.
  if (typeof ish === "string" && open && detail) {
    if (ish === "qr") redirect(`/kabinet/${open.normalized}/qr`);
    if (ish === "sorovlar" && detail.venue) {
      redirect(`/kabinet/${open.normalized}/sorovlar`);
    }
  }

  const telegramName = user.user_metadata?.telegram_name as string | undefined;
  const accountLabel =
    telegramName?.trim() ||
    (user.email?.endsWith("@telegram.flex.local") ? "Telegram" : user.email) ||
    "";

  // The cabinet is the one page only an owner loads, which makes it the
  // natural place to stamp activity. Deferred so it never delays the render.
  after(() => touchLastSeen(user.id));

  return (
    <PageShell>
      <div className="mb-7 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Kabinet</h1>
          {/* A Telegram account has an address nobody can write to — it exists
              so Supabase has something to key the user on. Showing it would be
              showing the person a mailbox that is not theirs, so the name they
              signed in with wins whenever there is one. */}
          <p className="mt-0.5 truncate text-sm text-flex-black/50">{accountLabel}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/kabinet/xabarlar"
            aria-label="Xabarlar"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-flex-black/60 transition-colors hover:bg-black/[0.03]"
          >
            <Bell className="h-4 w-4" />
            {/* A count rather than a dot: "three leads waiting" is worth
                opening the page for, "something happened" is not. */}
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-lime px-1 font-tabular text-[11px] font-semibold text-flex-black">
                {unread}
              </span>
            )}
          </Link>
          <Link
            href="/lenta"
            aria-label="Lenta"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-flex-black/60 transition-colors hover:bg-black/[0.03] lg:flex"
          >
            <Rss className="h-4 w-4" />
          </Link>
          <SignOutButton />
        </div>
      </div>

      <IncomingTransfers transfers={incoming} />

      {/* The company panel existed and nothing pointed at it: an owner had to
          know to type /kabinet/jamoa. One cabinet, one sign-in, and the
          company is a place you switch to rather than a second account. */}
      {team && (
        <Link
          href="/kabinet/jamoa"
          className="mb-4 flex items-center gap-4 rounded-[1.5rem] border border-black/10 bg-flex-black px-6 py-5 text-white transition-transform active:scale-[0.995]"
        >
          <Building2 className="h-5 w-5 shrink-0 text-lime" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold tracking-tight">{team.name}</p>
            <p className="mt-0.5 text-xs text-white/50">Firma hisobi</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
        </Link>
      )}

      {!open || !detail ? (
        <div className="rounded-[1.75rem] border border-dashed border-black/15 p-8 text-center">
          <p className="text-sm text-flex-black/60">
            Hali raqam olmagansiz. Bosh sahifadagi hisoblagichda narxni ko&apos;rib,
            o&apos;zingizga mos kombinatsiyani tanlang.
          </p>
          <Link
            href="/shaxsiy#narx"
            className="mt-6 inline-block rounded-full bg-lime px-6 py-3 font-medium text-flex-black shadow-[0_12px_30px_-10px_rgba(171,255,9,0.65)] transition-transform hover:scale-[1.01]"
          >
            Raqam tanlash
          </Link>
        </div>
      ) : (
        <>
          {handles.length > 1 && (
            <div className="mb-3 -mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
              {handles.map((h) =>
                h.normalized === open.normalized ? (
                  <span
                    key={h.normalized}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-flex-black px-4 py-2 font-tabular text-sm font-medium text-white"
                  >
                    {h.normalized}
                  </span>
                ) : (
                  <Link
                    key={h.normalized}
                    href={`/kabinet/${h.normalized}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 font-tabular text-sm text-flex-black/60 transition-colors hover:bg-black/[0.03]"
                  >
                    {h.normalized}
                    {h.status === "reserved" && <Clock className="h-3 w-3" />}
                  </Link>
                ),
              )}
            </div>
          )}

          <HandleHub
            handle={open}
            todayViews={detail.todayViews}
            leads={detail.leads}
            venue={detail.venue}
            waiting={detail.waiting}
            setup={detail.setup}
          />
        </>
      )}

      <div className="mt-6">
        <InstallHint />
      </div>
    </PageShell>
  );
}
