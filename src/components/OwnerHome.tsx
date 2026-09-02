import Link from "next/link";
import { QrCode, Pencil, Nfc, ChevronRight, Inbox } from "lucide-react";

import { formatNumber } from "@/lib/format";
import type { OwnedHandle } from "@/lib/handles";
import type { site } from "@/lib/i18n";

// The phone's home screen for somebody who already bought.
//
// An app is not a shorter website. Until now the signed-in owner opened Flex
// and got the shop: a search box for a number they already have, a fork
// between two products they already chose, and a shelf of things to buy. The
// thing they actually came to do — see whether anybody opened their card
// today — was three taps away in the cabinet.
//
// So this is what they get instead: their number, what it did today, and the
// three things they do with it. The shop is still one tap down, on the tiles.

type Site = ReturnType<typeof site>;

export default function OwnerHome({
  s,
  handle,
  todayViews,
  leads,
}: {
  s: Site;
  handle: OwnedHandle;
  /** Views in the last day. Zero is an answer, not a missing value. */
  todayViews: number;
  leads: number;
}) {
  return (
    <section className="px-6 pt-6">
      <p className="text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
        {s.yourHandle}
      </p>

      <Link
        href={`/${handle.normalized}`}
        className="grain relative mt-3 block overflow-hidden rounded-3xl bg-flex-black px-5 py-5 text-white transition-transform active:scale-[0.99]"
      >
        <div className="bg-dot-grid-light absolute inset-0 opacity-25" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-2xl font-semibold tracking-tight">
              {handle.normalized}
            </p>
            <p className="mt-0.5 truncate text-sm text-white/50">
              {handle.name || `flex.com.uz/${handle.normalized}`}
            </p>
          </div>
          {handle.plan === "premium" && (
            <span className="shrink-0 rounded-full border border-[#d9b169]/40 px-2.5 py-1 text-[10px] font-medium tracking-widest text-[#d9b169] uppercase">
              Premium
            </span>
          )}
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
          <Stat value={handle.viewCount} label={s.statViews} />
          <Stat value={todayViews} label={s.statToday} />
          <Stat value={leads} label={s.statLeads} />
        </div>
      </Link>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Action
          href={`/kabinet/${handle.normalized}#qr`}
          label={s.actionQr}
          Icon={QrCode}
        />
        <Action
          href={`/kabinet/${handle.normalized}`}
          label={s.actionEdit}
          Icon={Pencil}
        />
        <Action href="/qurilmalar" label={s.actionDevice} Icon={Nfc} />
      </div>

      {leads > 0 && (
        <Link
          href={`/kabinet/${handle.normalized}#kontaktlar`}
          className="mt-3 flex items-center gap-3 rounded-2xl border border-lime-ink/25 bg-lime/[0.12] px-4 py-3.5 transition-transform active:scale-[0.99]"
        >
          <Inbox className="h-5 w-5 shrink-0 text-lime-ink" strokeWidth={1.8} />
          <p className="flex-1 text-sm font-medium">{s.leadsWaiting(formatNumber(leads))}</p>
          <ChevronRight className="h-4 w-4 shrink-0 text-flex-black/30" />
        </Link>
      )}
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display font-tabular text-xl font-semibold">
        {formatNumber(value)}
      </p>
      <p className="mt-0.5 text-[10px] tracking-widest text-white/40 uppercase">{label}</p>
    </div>
  );
}

function Action({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: typeof QrCode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl border border-black/10 bg-white px-2 py-4 text-center transition-transform active:scale-[0.98]"
    >
      <Icon className="h-5 w-5 text-flex-black/60" strokeWidth={1.7} />
      <span className="text-xs leading-tight font-medium">{label}</span>
    </Link>
  );
}
