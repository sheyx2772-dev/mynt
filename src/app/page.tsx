// The entry page.
//
// Its job is to route, not to explain: a visitor arrives not knowing whether
// this is for a person or for a cafe, and every second spent working that out
// is a second before they reach the room they came for. So the fork is stated
// first, then the two shelves — devices and verticals — carry them into it,
// each tile landing on its own destination rather than a shared page top.
//
// Everything under that answers what the router just offered, in the order a
// first visit asks for it: see it work, how it works, the four usual doubts,
// what is already true, what it costs, and the questions left over.

import {
  Link2,
  Nfc,
  Sparkles,
  BarChart3,
  Users,
  Target,
  RefreshCw,
  TrendingUp,
  Check,
  Minus,
  ChevronDown,
  Car,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Mark from "@/components/Mark";
import PricingCalculator from "@/components/PricingCalculator";
import ProfilePreview from "@/components/ProfilePreview";
import PhoneFrame from "@/components/PhoneFrame";
import HandleChecker from "@/components/HandleChecker";
import HeroStage from "@/components/HeroStage";
import Image from "next/image";
import { productShot } from "@/lib/product-shots";
import DeviceTile from "@/components/DeviceTile";
import { DEVICE_TYPES } from "@/lib/devices";
import { formatNumber, formatUZS } from "@/lib/format";
import { TEAM_SEAT_MONTHLY, MIN_TEAM_SEATS } from "@/lib/plans";
import { site, landing, catalogue, picker } from "@/lib/i18n";
import { listNewestResidents, getDirectoryCounts, listHandlesForUser } from "@/lib/handles";
import { getUser } from "@/lib/auth";
import { getHandleStats } from "@/lib/analytics";
import { listLeads } from "@/lib/leads";
import LiveResidents from "@/components/LiveResidents";
import AppHome from "@/components/AppHome";
import TwoWays from "@/components/TwoWays";
import LoadoutStrip from "@/components/LoadoutStrip";
import { deviceStrip, verticalStrip } from "@/lib/strip-items";
import MobileMenu from "@/components/MobileMenu";
import { getLang } from "@/lib/lang";
import { home } from "@/lib/i18n-home";
import Plate from "@/components/ui/Plate";
import { VENUE_BANDS } from "@/lib/venues";
import { paperButton } from "@/components/ui/paper/Button";
import { BASE_PRICE } from "@/lib/pricing";
import { DELIVERY } from "@/lib/company";
import { PLANS } from "@/lib/plans";
import { ArrowUpRight } from "lucide-react";
import LangSwitch from "@/components/LangSwitch";
import { COMPANY } from "@/lib/company";
import PlanTable from "@/components/PlanTable";
import TeamOrderForm from "@/components/TeamOrderForm";

// The profile the "try it" tile opens.
const DEMO_HANDLE = "NAV001";

const NAMESPACE_SIZE = 26 * 26 * 26 * 10 * 10 * 10;

// Which icon goes with which entry, in the dictionary's order. Kept out of the
// dictionary because an icon is not a translation.
const CONSUMER_ICONS = [Link2, Nfc, Sparkles, BarChart3, Car];
const BUSINESS_ICONS = [Users, Target, RefreshCw, TrendingUp];

// Who has what, in the same order as the dictionary's row labels. A claim about
// a competitor is a fact rather than copy, so it does not move with the words —
// and every row here is one this product actually does.
const COMPARISON = [
  { unqx: true, popl: false, flex: true },
  { unqx: true, popl: false, flex: true },
  { unqx: true, popl: true, flex: true },
  { unqx: false, popl: true, flex: true },
  { unqx: false, popl: true, flex: true },
  { unqx: true, popl: false, flex: true },
];


export async function generateMetadata({
  searchParams,
}: PageProps<"/">): Promise<Metadata> {
  const { til } = await searchParams;
  const t = site(await getLang(til));
  return { title: `Flex — ${t.tagline}`, description: t.metaDescription };
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const { til } = await searchParams;
  const lang = await getLang(til);
  const s = site(lang);
  const h = home(lang);
  const premium = PLANS.find((x) => x.id === "premium")!;
  const prices = [
    {
      name: h.audiences[0].name,
      start: `${formatUZS(BASE_PRICE, lang)}${lang === "uz" ? "dan" : ""}`,
      startNote: s.pricePersonalNote,
      sub: `${formatUZS(premium.monthly, lang)} / ${h.perMonth}`,
      subNote: formatUZS(premium.yearly, lang),
      after:
        lang === "ru"
          ? "Профиль открывается, редактирование закрыто"
          : lang === "en"
            ? "The profile still opens; editing closes"
            : "Profil ochilaveradi, tahrir yopiladi",
      href: "/shaxsiy#narx",
      lead: true,
    },
    {
      name: h.audiences[1].name,
      start: `${formatUZS(TEAM_SEAT_MONTHLY, lang)} / ${h.perSeat}`,
      startNote:
        lang === "ru" ? "минимум 5 сотрудников" : lang === "en" ? "five employees minimum" : "kamida 5 xodim",
      sub: `${formatUZS(TEAM_SEAT_MONTHLY, lang)} / ${h.perMonth}`,
      subNote:
        lang === "ru" ? "счёт-фактура" : lang === "en" ? "invoiced" : "hisob-faktura",
      after:
        lang === "ru"
          ? "Номера остаются в компании"
          : lang === "en"
            ? "The numbers stay with the company"
            : "Raqamlar kompaniyada qoladi",
      href: "/biznes#jamoa",
      lead: false,
    },
    {
      name: h.audiences[2].name,
      start:
        lang === "ru"
          ? "По числу столов"
          : lang === "en"
            ? "By table count"
            : "Stollar soniga qarab",
      startNote:
        lang === "ru" ? "до 15 столов" : lang === "en" ? "up to 15 tables" : "15 tagacha stol",
      sub: `${formatUZS(VENUE_BANDS[0].monthly, lang)} / ${h.perMonth}`,
      subNote:
        lang === "ru" ? "меню, QR и NFC включены" : lang === "en" ? "menu, QR and NFC included" : "menyu, QR va NFC kiradi",
      after:
        lang === "ru"
          ? "Меню открывается, заявки останавливаются"
          : lang === "en"
            ? "The menu still opens; requests stop"
            : "Menyu ochilaveradi, so'rovlar to'xtaydi",
      href: "/biznes",
      lead: false,
    },
  ];

  const copy = landing(lang);
  const c = catalogue(lang);
  const p = picker(lang);

  const [newest, counts, user] = await Promise.all([
    listNewestResidents(),
    getDirectoryCounts(),
    getUser(),
  ]);

  // What an owner opens the app for. Only the newest claimed handle: somebody
  // with several has a cabinet, and a home screen that lists everything is a
  // cabinet with extra steps.
  const owned = user ? await listHandlesForUser(user.id) : [];
  const primary = owned.find((h) => h.status === "claimed") ?? null;

  const owner = primary
    ? await (async () => {
        const [stats, leads] = await Promise.all([
          getHandleStats(primary.normalized, 1),
          listLeads(primary.normalized, user!.id),
        ]);
        return {
          handle: primary,
          todayViews: stats.totalViews,
          leads: leads.length,
        };
      })()
    : null;

  const tapShot = productShot("tegizish");
  const carShot = productShot("avtovizitka");
  const devices = deviceStrip(lang);
  const verticals = verticalStrip(lang);
  const familyShot = productShot("oila");

  return (
    <div className="flex min-h-full flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-flex-black/85 text-white backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
            {/* Telefonda sarlavha qatoridagi yagona yo'l — desktopdagi
                bo'limlar ro'yxati shu yerga yig'ilgan. */}
            <MobileMenu
              openLabel={s.menuOpen}
              closeLabel={s.menuClose}
              cta={{ href: "/shaxsiy#narx", label: s.getHandle }}
              items={[
                { href: "/shaxsiy#narx", label: s.navPricing },
                { href: "/shaxsiy", label: s.navPersonal },
                { href: "/biznes", label: s.navBusiness },
                { href: "#savollar", label: s.navFaq },
                { href: "/qurilmalar", label: s.navDevices },
                { href: "/shaxsiy#tarif", label: s.navPlans },
                { href: "/rezidentlar", label: s.navResidents },
                { href: "/kabinet", label: s.navCabinet },
              ]}
            >
              <LangSwitch lang={lang} next="/" tone="dark" />
            </MobileMenu>
            <Mark className="h-7 w-7" tone="dark" />
            flex
          </div>
          <nav className="hidden gap-8 text-sm font-medium text-white/55 lg:flex">
            <Link href="/shaxsiy#narx" className="transition-colors hover:text-white">
              {s.navPricing}
            </Link>
            <Link
              href="/shaxsiy"
              className="transition-colors hover:text-white"
            >
              {s.navPersonal}
            </Link>
            <Link href="/biznes" className="transition-colors hover:text-white">
              {s.navBusiness}
            </Link>
            <a href="#savollar" className="transition-colors hover:text-white">
              {s.navFaq}
            </a>
            {/* Signed-out visitors are sent to sign-in from there, which keeps
                this page static rather than making it depend on a session. */}
            <Link
              href="/qurilmalar"
              className="transition-colors hover:text-white"
            >
              {s.navDevices}
            </Link>
            <Link
              href="/rezidentlar"
              className="transition-colors hover:text-white"
            >
              {s.navResidents}
            </Link>
            <Link
              href="/kabinet"
              className="transition-colors hover:text-white"
            >
              {s.navCabinet}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden lg:block">
              <LangSwitch lang={lang} next="/" tone="dark" />
            </div>
            <a
              href="#narx"
              className="rounded-full bg-lime px-4 py-2 text-sm font-medium text-flex-black transition-colors hover:bg-lime/85"
            >
              {s.getHandle}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* The fork is the first screen: two products, said as two, before
            anything is explained. The hero that used to be here follows it —
            it sells the personal side, and a visitor who came for the business
            side should not have to scroll past a pitch to find out we have one.
            The phone gets the same pair inside AppHome. */}
        <div className="hidden lg:block">
          <TwoWays s={s} />
        </div>

        {/* Third block, straight after the offer. Somebody who has read the
            fork and then the offer is now deciding what the thing looks like,
            and that is decided by looking rather than by reading — so nothing
            goes between. Desktop only; AppHome carries the same two rows. */}
        <div className="hidden pb-6 lg:block">
          <LoadoutStrip items={devices} label={p.groupDevices} note={p.groupDevicesNote} />
          <LoadoutStrip
            items={verticals}
            label={p.groupDirections}
            note={p.groupDirectionsNote}
          />
        </div>

        {/* 2 — try it before buying ------------------------------------ */}
        <section
          id="sinash"
          className="scroll-mt-20 border-y border-line bg-white py-14 sm:py-16"
        >
          <div className="mx-auto grid max-w-[1120px] items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-[28px] leading-[32px] font-semibold tracking-[-0.01em] text-balance">
                {h.tryTitle}
              </h2>
              <p className="mt-4 max-w-[46ch] text-[16px] leading-6 text-ink-2">
                {h.tryLead}
              </p>
              {/* On a phone the QR is useless — nobody scans a code with the
                  phone displaying it — so the same demo is a link instead. */}
              <Link
                href={`/${DEMO_HANDLE}`}
                className={`${paperButton.secondary} mt-6 w-full sm:w-auto lg:hidden`}
              >
                {h.tryButton}
                <ArrowUpRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="hidden flex-col items-center gap-4 lg:flex">
              <div className="rounded-card border border-line bg-white p-4">
                {/* Served by the same route a printed card points at, so what
                    a visitor scans here is what a buyer gets. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/${DEMO_HANDLE}/qr`}
                  alt={`${DEMO_HANDLE} QR`}
                  width={200}
                  height={200}
                  className="h-[200px] w-[200px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Plate n={DEMO_HANDLE} size="sm" />
                <span className="text-[13px] leading-[18px] text-ink-3">
                  {h.tryCaption}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3 — how it works -------------------------------------------- */}
        <section className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="font-display text-[28px] leading-[32px] font-semibold tracking-[-0.01em]">
            {h.howTitle}
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {h.howSteps.map((step, i) => (
              <li key={step.title}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-input border border-line bg-white">
                  <Image
                    src={step.photo}
                    alt={step.alt}
                    fill
                    sizes="(min-width: 640px) 344px, 100vw"
                    className="object-cover"
                  />
                </div>
                <p className="num mt-4 font-display text-[20px] leading-6 font-semibold text-ink-3">
                  {i + 1}
                </p>
                <h3 className="mt-1 text-[20px] leading-6 font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-[16px] leading-6 text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 7 — the four things people actually ask ---------------------- */}
        <section className="mx-auto max-w-[1120px] px-4 py-14 sm:px-6 sm:py-16">
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {h.trust.map((item) => (
              <li key={item.q}>
                <h3 className="text-[16px] leading-6 font-semibold">{item.q}</h3>
                <p className="mt-1.5 text-[14px] leading-5 text-ink-2">{item.a}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 6 — traction, counted rather than claimed -------------------- */}
        <section className="border-y border-line bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
            <h2 className="text-[13px] leading-[18px] text-ink-3">
              {h.tractionTitle}
            </h2>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="num font-display text-[48px] leading-none font-bold sm:text-[56px]">
                {formatNumber(counts.claimed)}
              </span>
              <span className="text-[17px] leading-6 text-ink-2">
                {h.tractionUnit}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-[18px] text-ink-3">
              {formatNumber(counts.namespace - counts.claimed)} {h.tractionLeft}
            </p>

            {/* Real numbers from the real table. A small honest figure is
                worth more than a wall of logos nobody can check — and any
                logo we do not have permission for is somebody else's mark. */}
            {newest.length > 0 && (
              <div className="mt-7">
                <p className="text-[12px] leading-4 font-medium tracking-[0.04em] text-ink-3 uppercase">
                  {h.tractionLatest}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {newest.map((r) => (
                    <li key={r.normalized}>
                      <Link href={`/${r.normalized}`}>
                        <Plate n={r.normalized} size="sm" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* 8 — prices --------------------------------------------------- */}
        <section
          id="narxlar"
          className="scroll-mt-20 border-y border-line bg-white py-16 sm:py-24"
        >
          <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
            <h2 className="font-display text-[28px] leading-[32px] font-semibold tracking-[-0.01em]">
              {h.pricesTitle}
            </h2>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {prices.map((p) => (
                <div
                  key={p.name}
                  className={`flex flex-col rounded-card border bg-white p-5 ${
                    p.lead ? "border-ink" : "border-line"
                  }`}
                >
                  <h3 className="text-[17px] leading-6 font-semibold">{p.name}</h3>

                  <dl className="mt-4 flex-1 space-y-3.5">
                    <div>
                      <dt className="text-[12px] leading-4 font-medium tracking-[0.04em] text-ink-3 uppercase">
                        {h.pricesStart}
                      </dt>
                      <dd className="num mt-1 text-[16px] leading-6 font-semibold">
                        {p.start}
                      </dd>
                      <dd className="text-[13px] leading-[18px] text-ink-3">
                        {p.startNote}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[12px] leading-4 font-medium tracking-[0.04em] text-ink-3 uppercase">
                        {h.pricesSub}
                      </dt>
                      <dd className="num mt-1 text-[16px] leading-6 font-semibold">
                        {p.sub}
                      </dd>
                      <dd className="text-[13px] leading-[18px] text-ink-3">
                        {p.subNote}
                      </dd>
                    </div>
                    {/* Everybody asks this one silently. Answer it in the
                        table, or they assume the answer is a trap. */}
                    <div>
                      <dt className="text-[12px] leading-4 font-medium tracking-[0.04em] text-ink-3 uppercase">
                        {h.pricesAfter}
                      </dt>
                      <dd className="mt-1 text-[14px] leading-5 text-ink-2">
                        {p.after}
                      </dd>
                    </div>
                  </dl>

                  <Link
                    href={p.href}
                    className={`${p.lead ? paperButton.primary : paperButton.secondary} mt-5 w-full`}
                  >
                    {h.pricesCta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Who has just joined, and how much of the namespace is gone. Directly
            under the hero, because it is the first thing a scroll reveals and
            it is the only proof on the page that other people are buying. */}
        <div className="hidden bg-flex-black lg:block">
          <LiveResidents
            residents={newest}
            claimed={counts.claimed}
            namespace={counts.namespace}
            labels={{ taken: s.takenWord, left: s.leftWord, latest: s.latestWord }}
          />
        </div>

        {/* On a phone this is the whole entry screen. See AppHome. */}
        <AppHome
          s={s}
          residents={newest}
          claimed={counts.claimed}
          namespace={counts.namespace}
          devices={devices}
          verticals={verticals}
          stripLabels={{
            devices: p.groupDevices,
            devicesNote: p.groupDevicesNote,
            directions: p.groupDirections,
            directionsNote: p.groupDirectionsNote,
          }}
          owner={owner}
        />

        {/* FAQ */}
        <section id="savollar" className="scroll-mt-20 mx-auto max-w-3xl px-6 py-14 sm:py-24">
          <p className="mb-3 text-center text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
            Savollar
          </p>
          <h2 className="text-center font-display text-2xl font-semibold tracking-tight sm:text-4xl">
            {s.faq}
          </h2>
          <div className="mt-10 space-y-3">
            {copy.faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-black/10 bg-white p-5 open:shadow-[0_12px_30px_-16px_rgba(14,10,27,0.2)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium marker:content-none">
                  {item.q}
                  <ChevronDown className="h-4 w-4 text-flex-black/40 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-flex-black/65">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="grain relative overflow-hidden bg-flex-black pt-16 pb-10 text-white">
        <div className="bg-dot-grid-light absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-display text-xl font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime">
                  <span className="h-2 w-2 rounded-full bg-flex-black" />
                </span>
                flex
              </div>
              <p className="mt-3 max-w-[220px] text-sm text-white/50">
                {s.tagline}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                {s.product}
              </p>
              <ul className="mt-3 space-y-0.5 text-sm text-white/60">
                <li>
                  <a
                    href="#narx"
                    className="block py-1.5 transition-colors hover:text-white"
                  >
                    {s.navPricing}
                  </a>
                </li>
                <li>
                  <a
                    href="#individual"
                    className="block py-1.5 transition-colors hover:text-white"
                  >
                    {s.personalProfile}
                  </a>
                </li>
                <li>
                  <a href="#" className="block py-1.5 transition-colors hover:text-white">
                    FLEX CARD
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                {s.navBusiness}
              </p>
              <ul className="mt-3 space-y-0.5 text-sm text-white/60">
                <li>
                  <a
                    href="#biznes"
                    className="block py-1.5 transition-colors hover:text-white"
                  >
                    {s.teamCards}
                  </a>
                </li>
                <li>
                  <a href="#" className="block py-1.5 transition-colors hover:text-white">
                    {s.contactCollection}
                  </a>
                </li>
                <li>
                  <a href="#" className="block py-1.5 transition-colors hover:text-white">
                    {lang === "ru" ? "Режим мероприятия" : lang === "en" ? "Event mode" : "Tadbir rejimi"}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                {s.company}
              </p>
              <ul className="mt-3 space-y-0.5 text-sm text-white/60">
                <li>
                  <a
                    href="#savollar"
                    className="block py-1.5 transition-colors hover:text-white"
                  >
                    {s.navFaq}
                  </a>
                </li>
                <li>
                  <Link href="/shartlar" className="block py-1.5 transition-colors hover:text-white">
                    {s.footerTerms}
                  </Link>
                </li>
                <li>
                  <a
                    href={`tel:${COMPANY.phoneHref}`}
                    className="block py-1.5 transition-colors hover:text-white"
                  >
                    {COMPANY.phone}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row">
            <p>
              &copy; {new Date().getFullYear()} Flex &mdash; {COMPANY.legalName}. STIR{" "}
              {COMPANY.inn}.
            </p>
            <Link href="/shartlar" className="block py-1.5 transition-colors hover:text-white/70">
              {s.delivery}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
