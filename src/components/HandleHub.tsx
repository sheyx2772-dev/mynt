import Link from "next/link";
import {
  QrCode,
  Car,
  Package,
  Users,
  Pencil,
  BarChart3,
  CalendarClock,
  MessageSquare,
  Palette,
  ArrowLeftRight,
  ArrowLeft,
  BellRing,
  UtensilsCrossed,
  Store,
  Clock,
} from "lucide-react";

import { formatNumber } from "@/lib/format";
import type { OwnedHandle } from "@/lib/handles";
import type { Venue } from "@/lib/menu";
import { venueWords } from "@/lib/venue-words";
import { planState } from "@/lib/venue-billing";
import { isSetUp, type SetupState } from "@/lib/venue-setup";
import VenueSetup from "@/components/VenueSetup";

// One number's home screen.
//
// This used to be a single page carrying the profile form, the post composer,
// the design request, the transfer panel, the leads, the statistics and the QR
// code, in that order, one under the other. On a phone it was about eight
// screens of scrolling, and the two things an owner actually opens it for —
// what happened today, and the QR — were at opposite ends of it.
//
// So the page is now a hub: the number and what it did, then a tile for each
// screen behind it. Nothing was removed; everything moved one tap away and
// became findable.

export default function HandleHub({
  handle,
  todayViews,
  leads,
  venue,
  waiting,
  setup,
}: {
  handle: OwnedHandle;
  /** Views in the last day. Zero is an answer, not a missing value. */
  todayViews: number;
  leads: number;
  /** Set when this number is a place rather than a person. */
  venue: Venue | null;
  waiting: number;
  /** How far a new venue has got. Absent for a number that is a person. */
  setup?: SetupState | null;
}) {
  const at = (screen: string) => `/kabinet/${handle.normalized}/${screen}`;

  // A hotel's tile says Xizmatlar, not Menyu.
  const w = venue ? venueWords(venue.kind, "uz") : null;
  const plan = venue ? planState(venue.planExpiresAt) : null;

  return (
    <div>
      {/* The card, which is also the way to look at the public page. */}
      <Link
        href={`/${handle.normalized}`}
        className="relative block overflow-hidden rounded-[1.75rem] bg-ink-s2 px-6 py-6 text-paper transition-transform active:scale-[0.995]"
      >

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-3xl font-semibold tracking-tight">
              {handle.normalized}
            </p>
            <p className="mt-1 truncate font-tabular text-sm text-paper">
              flex.com.uz/{handle.normalized}
            </p>
          </div>

          {handle.status === "reserved" ? (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-warn-ink px-3 py-1 text-xs font-medium text-warn-ink">
              <Clock className="h-3 w-3" />
              To&apos;lov kutilmoqda
            </span>
          ) : (
            handle.plan === "premium" && (
              <span className="shrink-0 rounded-full border border-[#d9b169]/40 px-2.5 py-1 text-[10px] font-medium tracking-widest text-[#d9b169] uppercase">
                Premium
              </span>
            )
          )}
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
          <Stat value={handle.viewCount} label="Ko'rish" />
          <Stat value={todayViews} label="Bugun" />
          <Stat value={leads} label="Kontakt" />
        </div>
      </Link>

      {/* Before the buttons, while it still matters: a venue that has not been
          set up cannot tell which of them comes first, and the answer is not a
          matter of taste. Gone the moment the loop has closed once. */}
      {venue && w && setup && !isSetUp(setup) && (
        <div className="mt-3">
          <VenueSetup handle={handle.normalized} state={setup} w={w} />
        </div>
      )}

      {/* A cafe opens this to answer a table, so that comes before its own
          profile does. */}
      {venue && w && (
        <div className="mt-3 space-y-2.5">
          <Link
            href={at("sorovlar")}
            className="flex items-center justify-between gap-3 rounded-2xl bg-lime px-5 py-4 font-medium text-ink transition-transform active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              So&apos;rovlar
            </span>
            {waiting > 0 && (
              <span className="rounded-lg bg-ink-s2 px-2.5 py-1 font-tabular text-sm text-paper">
                {waiting}
              </span>
            )}
          </Link>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Link
              href={at("menyu")}
              className="flex items-center gap-2 rounded-2xl border border-ink-line bg-ink-s1 px-5 py-4 font-medium transition-transform active:scale-[0.99]"
            >
              <UtensilsCrossed className="h-4 w-4 text-paper-2" />
              {w.listTitle}
            </Link>

            {/* Where the tags come from. A venue with none has a menu nobody
                can reach, so the count is on the button. */}
            <Link
              href={at("nuqtalar")}
              className="flex items-center justify-between gap-3 rounded-2xl border border-ink-line bg-ink-s1 px-5 py-4 font-medium transition-transform active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-paper-2" />
                {w.pointsTitle}
              </span>
              <span className="font-tabular text-xs text-paper-3">
                {venue.points.length || "—"}
              </span>
            </Link>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {/* Not a tile: this is the weekly question, not a daily one. */}
            <Link
              href={at("hisobot")}
              className="flex items-center gap-2 rounded-2xl border border-ink-line bg-ink-s1 px-5 py-4 font-medium transition-transform active:scale-[0.99]"
            >
              <BarChart3 className="h-4 w-4 text-paper-2" />
              Hisobot
            </Link>

            <Link
              href={at("obuna")}
              className="flex items-center justify-between gap-3 rounded-2xl border border-ink-line bg-ink-s1 px-5 py-4 font-medium transition-transform active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-paper-2" />
                Obuna
              </span>
              <span className="font-tabular text-xs text-paper-3">
                {plan?.active ? `${plan.daysLeft} kun` : "tugagan"}
              </span>
            </Link>
          </div>

          {/* Said where the owner is already looking, and only when it matters:
              a month that has run out has taken the call button off their
              tables, which they would otherwise discover from a guest. */}
          {plan && !plan.active && (
            <Link
              href={at("obuna")}
              className="flex items-center gap-3 rounded-2xl border-l-[3px] border-danger-ink bg-danger-ink/10 px-5 py-4 text-sm"
            >
              <span className="flex-1">
                <strong className="font-medium">Obuna muddati tugagan.</strong>{" "}
                {w?.listTitle} ochiq, lekin chaqiruv tugmasi stollarda ko&apos;rinmaydi.
              </span>
            </Link>
          )}

          {plan?.endingSoon && (
            <Link
              href={at("obuna")}
              className="flex items-center gap-3 rounded-2xl border border-ink-line bg-ink-s1 px-5 py-3.5 text-sm text-paper-2"
            >
              Obunaga {plan.daysLeft} kun qoldi.
            </Link>
          )}
        </div>
      )}

      {/* Three across, because that is what fits a thumb without the labels
          wrapping, and every screen the cabinet has is on one of them. */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Tile href={at("qr")} label="QR-kod" Icon={QrCode} />
        <Tile href={at("tahrirlash")} label="Tahrirlash" Icon={Pencil} />
        <Tile href={at("statistika")} label="Statistika" Icon={BarChart3} count={leads} />
        <Tile href={at("postlar")} label="Postlar" Icon={MessageSquare} />
        <Tile href={at("dizayn")} label="Dizayn" Icon={Palette} />
        <Tile href={at("qurilma")} label="Qurilma" Icon={Package} />
        <Tile href={at("tarmoq")} label="Tarmoq" Icon={Users} />
        <Tile href={at("buyumlar")} label="Buyumlar" Icon={Car} />
        <Tile href={at("otkazish")} label="O'tkazish" Icon={ArrowLeftRight} />
      </div>

      {/* The way in for a number that is going to be a place. Quiet, because
          most numbers are a person and never will be. */}
      {!venue && handle.status === "claimed" && (
        <Link
          href={at("obyekt")}
          className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-ink-line px-5 py-4 text-sm text-paper-2 transition-colors hover:bg-ink-s2"
        >
          <Store className="h-4 w-4 shrink-0 text-paper-3" strokeWidth={1.7} />
          Kafe, mehmonxona yoki do&apos;konmi? Obyekt oching — menyu va so&apos;rovlar.
        </Link>
      )}

      {handle.status === "reserved" && (
        <p className="mt-4 rounded-2xl border border-dashed border-ink-line px-5 py-4 text-sm text-paper-2">
          Raqam siz uchun band qilingan. To&apos;lov yakunlangach profil ochiladi va post
          joylay olasiz.
        </p>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display font-tabular text-xl font-semibold">{formatNumber(value)}</p>
      <p className="mt-0.5 text-[10px] tracking-widest text-paper uppercase">{label}</p>
    </div>
  );
}

function Tile({
  href,
  label,
  Icon,
  count = 0,
}: {
  href: string;
  label: string;
  Icon: typeof QrCode;
  /** Shown as a badge when there is something waiting behind the tile. */
  count?: number;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center gap-2 rounded-2xl border border-ink-line bg-ink-s1 px-2 py-4 text-center transition-transform active:scale-[0.98]"
    >
      {count > 0 && (
        <span className="absolute top-2 right-2 rounded-full bg-lime px-1.5 py-0.5 font-tabular text-[10px] font-semibold text-ink">
          {count}
        </span>
      )}
      <Icon className="h-5 w-5 text-paper-2" strokeWidth={1.7} />
      <span className="text-xs leading-tight font-medium">{label}</span>
    </Link>
  );
}

/** The shared head of every screen behind a tile: back to the hub, and a name. */
export function SubScreen({
  handle,
  title,
  hint,
  children,
}: {
  handle: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Link
        href={`/kabinet/${handle}`}
        className="mb-6 inline-flex items-center gap-1.5 self-start text-sm text-paper-2 transition-colors hover:text-paper"
      >
        <ArrowLeft className="h-4 w-4" />
        {handle}
      </Link>

      <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
      {hint && <p className="mt-1 text-sm text-paper-2">{hint}</p>}

      <div className="mt-7">{children}</div>
    </>
  );
}
