import Link from "next/link";
import { Calculator, ChevronRight, CreditCard, Nfc, Store, User, Users } from "lucide-react";
import HandleChecker from "@/components/HandleChecker";
import FloatingCarousel, { type CarouselItem } from "@/components/FloatingCarousel";
import OwnerHome from "@/components/OwnerHome";
import type { OwnedHandle } from "@/lib/handles";
import { formatNumber } from "@/lib/format";
import type { Resident } from "@/lib/handles";
import type { site } from "@/lib/i18n";
import { SITE_HOST } from "@/lib/site-url";

// The phone's home screen.
//
// Everything else on the landing page is a pitch: a hero, a walkthrough, a
// comparison table, an argument. That is what a desktop visitor came for and
// what a phone visitor has to scroll past. An app opens to the thing you do
// with it, so this opens to the search box and four places to go.
//
// It replaces the hero on a phone rather than sitting above it, so nobody
// scrolls through both. The marketing page is still the whole page at lg and up.

type Site = ReturnType<typeof site>;

function Tile({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: typeof Nfc;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col justify-between rounded-tile border border-line-soft bg-white p-6 sm:p-8 shadow-photo transition-transform active:scale-[0.98]"
    >
      <Icon className="h-6 w-6 text-ink-2" strokeWidth={1.6} />
      <span className="mt-6 text-sm leading-tight font-medium">{label}</span>
    </Link>
  );
}

export default function AppHome({
  s,
  claimed,
  namespace,
  carousel,
  owner,
}: {
  s: Site;
  claimed: number;
  namespace: number;
  carousel: CarouselItem[];
  /** Present only for a signed-in owner who has a handle. */
  owner?: { handle: OwnedHandle; todayViews: number; leads: number } | null;
}) {
  return (
    <div className="lg:hidden">
      {owner && (
        <OwnerHome
          s={s}
          handle={owner.handle}
          todayViews={owner.todayViews}
          leads={owner.leads}
        />
      )}

      {/* The shop, for somebody who has not bought yet. An owner opens the app
          to see what their card did today, not to be sold the thing they are
          holding — so for them this whole block is skipped and the shelf below
          is where buying still lives. */}
      {!owner && (
      <section className="grain relative overflow-hidden bg-flex-black px-6 pt-7 pb-9 text-white">
        <div className="bg-dot-grid-light absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-lime/[0.15] blur-[110px]" />

        <div className="relative lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-center lg:gap-12">
          <div className="relative">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink-line bg-white/5 px-3 py-1.5 text-[10px] font-medium tracking-wide text-paper-2 uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
            {s.heroBadge}
          </p>

          {/* The brand line, not the task. An app that opens straight onto a
              form has told the person nothing about what they opened; the
              desktop hero says this and the phone was left without it. */}
          <h1 className="font-display text-[1.75rem] leading-[1.12] font-semibold tracking-tight text-balance">
            {s.heroTitleA && <>{s.heroTitleA} </>}
            <span className="rounded-plate bg-lime px-1.5 text-flex-black">
              {s.heroTitleMark}
            </span>{" "}
            {s.heroTitleB}
          </h1>

          <p className="mt-5 text-paper-3 text-xs font-semibold tracking-widest uppercase">
            {s.pickHandle}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-paper-2">
            {s.stepHandleDesc}
          </p>

          {/* The checker carries its own top margin for the hero; here it sits
              directly under two lines, so the wrapper pulls it back. */}
          <div className="-mt-5">
            <HandleChecker
              tone="dark"
              labels={{
                check: s.checkFree,
                letters: s.letters,
                digits: s.digits,
                error: s.handleError,
              }}
            />
          </div>

          {claimed > 0 && (
            <p className="mt-5 font-tabular text-xs text-paper-3">
              <span className="text-paper-2">{formatNumber(claimed)}</span>{" "}
              {s.takenWord}
              <span className="mx-2 text-white/20">·</span>
              <span className="text-paper-2">
                {formatNumber(namespace - claimed)}
              </span>{" "}
              {s.leftWord}
            </p>
          )}
          </div>

          {/* The card, suspended. It is the object the number is issued on, so
              it belongs beside the number rather than further down a page. */}
          <div className="mx-auto mt-9 w-full max-w-[19rem] px-2 sm:max-w-[22rem] lg:mt-0 lg:max-w-none lg:px-0">
            <FloatingCarousel items={carousel} />
          </div>
        </div>
      </section>
      )}

      {/* The fork first: which of the two products is this person here for.
          Everything under it is the personal side, which is what the four
          tiles below are. */}
      {!owner && (
      <section className="px-6 pt-7">
        <p className="mb-3 text-ink-3 text-xs font-semibold tracking-widest uppercase">
          {s.waysEyebrow}
        </p>
        <div className="grid gap-3">
          <Link
            href="/shaxsiy"
            className="flex items-center gap-4 rounded-tile bg-lime p-6 sm:p-8 text-flex-black shadow-glow transition-transform active:scale-[0.99]"
          >
            <User className="h-6 w-6 shrink-0 text-ink-2" strokeWidth={1.6} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold tracking-tight">
                {s.wayPersonal}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-2">
                {s.wayPersonalDesc}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
          </Link>

          <Link
            href="/biznes"
            className="grain relative flex items-center gap-4 overflow-hidden rounded-tile bg-flex-black p-6 sm:p-8 text-white transition-transform active:scale-[0.99]"
          >
            <Store className="relative h-6 w-6 shrink-0 text-lime" strokeWidth={1.6} />
            <div className="relative min-w-0 flex-1">
              <p className="font-display text-lg font-semibold tracking-tight">
                {s.wayBusiness}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-paper-2">
                {s.wayBusinessDesc}
              </p>
            </div>
            <ChevronRight className="relative h-4 w-4 shrink-0 text-lime" />
          </Link>
        </div>
      </section>
      )}

    </div>
  );
}

/**
 * The lower half of the app layout: where to go next, and who has just joined.
 *
 * Split from AppHome so the three shelves between them can be rendered once
 * for both layouts instead of twice — see Strips.tsx. The page puts that block
 * between these two, and because each half is hidden at the other width the
 * sequence still reads in order at both.
 */
export function AppTiles({
  s,
  residents,
}: {
  s: Site;
  residents: Resident[];
}) {
  const newest = residents.slice(0, 3);

  return (
    <div className="lg:hidden">
      {/* Four destinations, thumb-sized. The sections these replace are hidden
          on a phone; each of these is where that content actually lives. */}
      <nav className="grid grid-cols-2 gap-3 px-6 pt-6">
        <Tile href="/shaxsiy#narx" label={s.calcPrice} Icon={Calculator} />
        <Tile href="/qurilmalar" label={s.navDevices} Icon={Nfc} />
        <Tile href="/rezidentlar" label={s.navResidents} Icon={Users} />
        <Tile href="/shaxsiy#tarif" label={s.navPlans} Icon={CreditCard} />
      </nav>

      {newest.length > 0 && (
        <section className="px-6 pt-9">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-ink-3 text-xs font-semibold tracking-widest uppercase">
              {s.appNewResidents}
            </h2>
            <Link
              href="/rezidentlar"
              className="text-xs font-medium text-ink-2"
            >
              {s.seeAll}
            </Link>
          </div>

          <ul className="space-y-2">
            {newest.map((r) => (
              <li key={r.normalized}>
                <Link
                  href={`/${r.normalized}`}
                  className="flex items-center gap-3 rounded-card border border-line-soft bg-white px-4 py-3 transition-transform active:scale-[0.99]"
                >
                  {r.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external R2 URL
                    <img
                      src={r.avatarUrl}
                      alt={r.name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime font-display text-xs font-semibold text-flex-black">
                      {r.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="font-tabular text-xs text-ink-3">
                      {SITE_HOST}/{r.normalized}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  );
}
