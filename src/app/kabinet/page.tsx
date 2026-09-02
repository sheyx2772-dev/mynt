import Link from "next/link";
import { after } from "next/server";
import { listNotifications } from "@/lib/notify";
import type { Metadata } from "next";
import { Pencil, QrCode, Clock, Building2, ChevronRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import SignOutButton from "@/components/SignOutButton";
import InstallHint from "@/components/InstallHint";
import { requireUser } from "@/lib/auth";
import { listHandlesForUser, touchLastSeen } from "@/lib/handles";
import IncomingTransfers from "@/components/IncomingTransfers";
import { listIncomingTransfers } from "@/lib/transfers";
import { getTeamForUser } from "@/lib/teams";
import { formatUZS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Kabinet — flex.com.uz",
  robots: { index: false },
};

export default async function CabinetPage() {
  const user = await requireUser("/kabinet");
  const [handles, incoming, notifications, team] = await Promise.all([
    listHandlesForUser(user.id),
    listIncomingTransfers(user.email ?? ""),
    listNotifications(user.id),
    getTeamForUser(user.id),
  ]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

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
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Kabinet</h1>
          {/* A Telegram account has an address nobody can write to — it exists
              so Supabase has something to key the user on. Showing it would be
              showing the person a mailbox that is not theirs, so the name they
              signed in with wins whenever there is one. */}
          <p className="mt-1 text-sm text-flex-black/50">{accountLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/kabinet/xabarlar"
            className="relative rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-flex-black/60 transition-colors hover:bg-black/[0.03]"
          >
            Xabarlar
            {/* A count rather than a dot: "three leads waiting" is worth
                opening the page for, "something happened" is not. */}
            {unreadCount > 0 && (
              <span className="ml-1.5 font-tabular text-xs font-semibold text-flex-black">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/lenta"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-flex-black/60 transition-colors hover:bg-black/[0.03]"
          >
            Lenta
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
          className="mb-6 flex items-center gap-4 rounded-[1.5rem] border border-black/10 bg-flex-black px-6 py-5 text-white transition-transform hover:scale-[1.005]"
        >
          <Building2 className="h-5 w-5 shrink-0 text-lime" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold tracking-tight">{team.name}</p>
            <p className="mt-0.5 text-xs text-white/50">Firma hisobi</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
        </Link>
      )}

      <InstallHint />

      {handles.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-black/15 p-8 text-center">
          <p className="text-sm text-flex-black/60">
            Hali handle olmagansiz. Bosh sahifadagi hisoblagichda narxni ko&apos;rib, o&apos;zingizga
            mos kombinatsiyani tanlang.
          </p>
          <Link
            href="/#narx"
            className="mt-6 inline-block rounded-full bg-lime px-6 py-3 font-medium text-flex-black shadow-[0_12px_30px_-10px_rgba(171,255,9,0.65)] transition-transform hover:scale-[1.01]"
          >
            Handle tanlash
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {handles.map((h) => (
            <div
              key={h.normalized}
              className="rounded-[1.5rem] border border-black/10 bg-white p-6 shadow-[0_20px_45px_-30px_rgba(14,10,27,0.3)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl font-semibold tracking-tight">
                    {h.normalized}
                  </p>
                  <p className="font-tabular text-xs text-flex-black/40">
                    flex.com.uz/{h.normalized}
                  </p>
                </div>
                {h.status === "reserved" ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    <Clock className="h-3 w-3" />
                    To&apos;lov kutilmoqda
                  </span>
                ) : (
                  <span className="rounded-full bg-lime/25 px-3 py-1 text-xs font-medium text-flex-black/70">
                    Sizniki
                  </span>
                )}
              </div>

              {h.pricePaid !== null && (
                <p className="mt-3 font-tabular text-sm text-flex-black/50">
                  {formatUZS(h.pricePaid)}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/kabinet/${h.normalized}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.03]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Tahrirlash
                </Link>
                <Link
                  href={`/kabinet/${h.normalized}#qr`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.03]"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  QR-kod
                </Link>
                <Link
                  href={`/${h.normalized}`}
                  className="inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.03]"
                >
                  Ko&apos;rish
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
