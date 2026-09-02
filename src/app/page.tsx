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
import { site, landing, catalogue } from "@/lib/i18n";
import { listNewestResidents, getDirectoryCounts } from "@/lib/handles";
import LiveResidents from "@/components/LiveResidents";
import AppHome from "@/components/AppHome";
import MobileMenu from "@/components/MobileMenu";
import { getLang } from "@/lib/lang";
import LangSwitch from "@/components/LangSwitch";
import { COMPANY } from "@/lib/company";
import PlanTable from "@/components/PlanTable";
import TeamOrderForm from "@/components/TeamOrderForm";

const NAMESPACE_SIZE = 26 * 26 * 26 * 10 * 10 * 10;

// Which icon goes with which entry, in the dictionary's order. Kept out of the
// dictionary because an icon is not a translation.
const CONSUMER_ICONS = [Link2, Nfc, Sparkles, BarChart3];
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
  const copy = landing(lang);
  const c = catalogue(lang);

  const [newest, counts] = await Promise.all([listNewestResidents(), getDirectoryCounts()]);

  const tapShot = productShot("tegizish");
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
              cta={{ href: "#narx", label: s.getHandle }}
              items={[
                { href: "#narx", label: s.navPricing },
                { href: "#individual", label: s.navPersonal },
                { href: "/biznes", label: s.navBusiness },
                { href: "#savollar", label: s.navFaq },
                { href: "/qurilmalar", label: s.navDevices },
                { href: "/tarif", label: s.navPlans },
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
            <a href="#narx" className="transition-colors hover:text-white">
              {s.navPricing}
            </a>
            <a
              href="#individual"
              className="transition-colors hover:text-white"
            >
              {s.navPersonal}
            </a>
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
        {/* Hero */}
        <section className="hidden grain relative overflow-hidden bg-flex-black text-white lg:block">
          <div className="bg-dot-grid-light absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
          <div className="absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-lime/[0.13] blur-[140px]" />

          <div className="relative mx-auto max-w-6xl px-6 pt-10 pb-16 sm:pt-28 sm:pb-28">
            <div className="grid items-center gap-10 sm:gap-16 lg:grid-cols-2">
              <div>
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[10px] font-medium tracking-wide text-white/70 uppercase backdrop-blur-sm sm:mb-6 sm:text-xs">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
                  {s.heroBadge}
                </p>
                <h1 className="font-display text-[2.1rem] font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl sm:leading-[0.98] lg:text-[4.5rem]">
                  {s.heroTitleA && <>{s.heroTitleA} </>}
                  <span className="marker-reveal inline-block rounded-md bg-lime px-2 text-flex-black">
                    {s.heroTitleMark}
                  </span>{" "}
                  {s.heroTitleB}
                </h1>
                <p className="mt-5 max-w-md leading-relaxed text-white/60 sm:mt-7 sm:text-lg">
                  {s.heroLead}
                </p>
                <HandleChecker tone="dark"
                    labels={{ check: s.checkFree, letters: s.letters, digits: s.digits, error: s.handleError }}
                  />

                <div className="mt-6 flex flex-wrap gap-4">
                  <a
                    href="#narx"
                    className="rounded-full bg-lime px-6 py-3 text-sm font-medium text-flex-black shadow-[0_12px_36px_-8px_rgba(171,255,9,0.5)] transition-transform hover:scale-[1.03] sm:px-7 sm:py-3.5 sm:text-base"
                  >
                    {s.calcPrice}
                  </a>
                  <a
                    href="#biznes"
                    className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:px-7 sm:py-3.5 sm:text-base"
                  >
                    {s.forBusiness}
                  </a>
                </div>
              </div>

              <div className="relative flex justify-center lg:justify-end">
                <div className="absolute -right-6 -bottom-4 z-20 hidden rotate-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-md sm:block">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-white/75">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                    {s.nfcOn}
                  </p>
                </div>

                <HeroStage shot={productShot("hero")} />
              </div>
            </div>
          </div>

          {/* The dark section ends on the page ground rather than a hard edge. */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white" />
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
        />

        {/* How it works */}
        <section className="hidden lg:block mx-auto max-w-6xl px-6 py-14 sm:py-24">
          <p className="mb-3 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
            {s.howItWorks}
          </p>
          <h2 className="max-w-lg font-display text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
            {s.threeSteps}
          </h2>

          <ol className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-3">
            <li>
              <div className="grain relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_30%,#211a3c_0%,#0b0817_72%)]">
                <div className="relative flex overflow-hidden rounded-xl border border-white/15 font-display text-xl font-semibold text-white">
                  <span className="px-3 py-2">MYN</span>
                  <span className="w-px bg-white/15" />
                  <span className="bg-lime px-3 py-2 font-tabular text-flex-black">
                    042
                  </span>
                </div>
              </div>
              <p className="mt-5 font-tabular text-xs font-semibold tracking-widest text-flex-black/30">
                01
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold">
                {s.pickHandle}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-flex-black/60">
                {s.stepHandleDesc}
              </p>
            </li>

            <li>
              <div className="grain relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_30%,#211a3c_0%,#0b0817_72%)]">
                {familyShot ? (
                  <Image
                    src={familyShot}
                    alt="Flex karta, uzuk va braslet"
                    fill
                    sizes="(min-width: 640px) 20rem, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-x-0 -top-8 h-32 bg-lime/10 blur-3xl" />
                    {/* Card, ring, bracelet — three silhouettes, each given one
                    lime mark so a black object stays legible on a black stage. */}
                    <div className="relative flex items-center gap-4">
                      <span className="relative h-16 w-24 rotate-[-8deg] rounded-lg border border-white/20 bg-[linear-gradient(140deg,#2b2250,#0c0818)] shadow-[0_18px_32px_-14px_rgba(0,0,0,0.95)]">
                        <span className="absolute bottom-2 left-2 h-1 w-6 rounded-full bg-lime" />
                      </span>
                      <span className="h-16 w-16 rounded-full border-[6px] border-white/20 bg-[linear-gradient(140deg,#312653,#0c0818)] shadow-[0_18px_32px_-14px_rgba(0,0,0,0.95),inset_0_0_0_2px_rgba(171,255,9,0.5)]" />
                      <span className="relative h-20 w-9 rotate-[6deg] rounded-full border border-white/20 bg-[linear-gradient(140deg,#2b2250,#0c0818)] shadow-[0_18px_32px_-14px_rgba(0,0,0,0.95)]">
                        <span className="absolute top-1/2 left-1/2 h-6 w-4 -translate-x-1/2 -translate-y-1/2 rounded-[40%] bg-black ring-1 ring-lime/60" />
                      </span>
                    </div>
                  </>
                )}
              </div>
              <p className="mt-5 font-tabular text-xs font-semibold tracking-widest text-flex-black/30">
                02
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold">
                {s.pickDevice}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-flex-black/60">
                {s.pickDeviceDesc}
              </p>
            </li>

            <li>
              <div className="grain relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_30%,#211a3c_0%,#0b0817_72%)]">
                {tapShot ? (
                  <Image
                    src={tapShot}
                    alt="Kartani telefonga tegizish"
                    fill
                    sizes="(min-width: 640px) 20rem, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <>
                    {/* Concentric rings: the tap, drawn. */}
                    <span className="absolute h-16 w-16 rounded-full border border-lime/25" />
                    <span className="absolute h-28 w-28 rounded-full border border-lime/15" />
                    <span className="absolute h-44 w-44 rounded-full border border-lime/10" />
                    <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-lime shadow-[0_0_40px_rgba(171,255,9,0.5)]">
                      <Nfc className="h-5 w-5 text-flex-black" />
                    </span>
                  </>
                )}
              </div>
              <p className="mt-5 font-tabular text-xs font-semibold tracking-widest text-flex-black/30">
                03
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold">
                {s.stepTap}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-flex-black/60">
                {s.stepTapDesc}
              </p>
            </li>
          </ol>
        </section>

        {/* Scarcity */}
        <section className="hidden lg:block grain relative overflow-hidden bg-flex-black py-14 sm:py-28">
          <div className="bg-dot-grid-light absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_50%_60%_at_50%_50%,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <p className="text-xs font-semibold tracking-widest text-lime/70 uppercase">
              {s.limited}
            </p>
            <p className="mt-5 font-display text-[clamp(2.75rem,11vw,7.5rem)] leading-[0.85] font-semibold tracking-tight text-white tabular-nums">
              {formatNumber(NAMESPACE_SIZE)}
            </p>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/55">
              {s.namespaceDesc}
            </p>
          </div>
        </section>

        {/* Pricing calculator */}
        <section id="narx" className="scroll-mt-20 mx-auto max-w-6xl px-6 py-14 sm:py-24">
          <div className="mb-12 max-w-lg">
            <p className="mb-3 text-xs font-semibold tracking-widest text-lime/80 uppercase [-webkit-text-stroke:0.3px_rgba(14,10,27,0.4)]">
              Narxlash
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-4xl">
              {s.priceOpen}
            </h2>
            <p className="mt-3 text-flex-black/65">
              {s.pricingDesc}
            </p>
          </div>
          <PricingCalculator
                lang={lang}
                labels={{
                  base: s.basePrice,
                  letterRarity: s.letterRarity,
                  digitRarity: s.digitRarity,
                  total: s.totalPrice,
                  deviceNote: s.deviceNote(formatUZS(DEVICE_TYPES[0].price, lang)),
                  tiers: s.tiers,
                  randomise: s.randomise,
                  take: s.takeHandle,
                  formula: s.formulaLabel,
                }}
              />
        </section>

        {/* The three parts of the price */}
        <section className="hidden lg:block mx-auto max-w-6xl px-6 pb-24">
          <div className="mb-10 max-w-lg">
            <p className="mb-3 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
              Obuna
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
              {s.priceThree}
            </h2>
            <p className="mt-4 leading-relaxed text-flex-black/60">
              {s.subscriptionDesc}
            </p>
          </div>
          <PlanTable c={c} lang={lang} />
        </section>

        {/* What a profile actually looks like */}
        <section
          id="individual"
          className="scroll-mt-20 border-t border-black/5 bg-black/[0.02] py-14 sm:py-24"
        >
          <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-[1fr_320px] lg:gap-20">
            <div>
              <p className="mb-3 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
                Shaxsiy
              </p>
              <h2 className="max-w-md font-display text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
                {s.oneTap}
              </h2>
              <p className="mt-4 max-w-md text-flex-black/65">
                {s.tapDesc}
              </p>

              <dl className="mt-10 divide-y divide-black/8 border-y border-black/8">
                {copy.consumer.map((f, i) => {
                  const Icon = CONSUMER_ICONS[i]!;
                  return (
                  <div key={f.title} className="flex gap-5 py-5">
                    <Icon
                      className="mt-0.5 h-5 w-5 shrink-0 text-flex-black/35"
                      strokeWidth={1.75}
                    />
                    <div>
                      <dt className="font-display font-semibold">{f.title}</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-flex-black/60">
                        {f.desc}
                      </dd>
                    </div>
                  </div>
                  );
                })}
              </dl>
            </div>

            <div className="hidden lg:block lg:pt-4">
              <PhoneFrame>
                <ProfilePreview />
              </PhoneFrame>
            </div>
          </div>
        </section>

        {/* The cards themselves. On a phone /qurilmalar is one tap from the
            app home and shows the same thing with room to breathe. */}
        <section className="hidden mx-auto max-w-6xl px-6 py-14 sm:py-24 lg:block">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-3 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
                {s.navDevices}
              </p>
              <h2 className="max-w-md font-display text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
                {s.oneNumberThree}
              </h2>
            </div>
            <Link
              href="/qurilmalar"
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.03]"
            >
              {s.seeAll}
            </Link>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {DEVICE_TYPES.map((device) => (
              <div key={device.id}>
                <DeviceTile type={device.id} alt={`Flex ${c.devices[device.id].name}`} />
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <h3 className="font-display font-semibold">{c.devices[device.id].name}</h3>
                  <span className="font-tabular text-sm text-flex-black/60">
                    {formatUZS(device.price, lang)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-flex-black/55">
                  {c.devices[device.id].tagline}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Business */}
        <section
          id="biznes"
          className="grain relative scroll-mt-20 overflow-hidden bg-flex-black py-14 sm:py-24"
        >
          <div className="bg-dot-grid-light absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-xl">
              <p className="mb-3 text-xs font-semibold tracking-widest text-lime/70 uppercase">
                {s.navBusiness}
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
                {s.notOneCard}
              </h2>
              <p className="mt-4 text-white/55">
                {s.businessDesc}
              </p>
            </div>

            <div className="mt-14 hidden gap-x-14 border-t border-white/10 sm:grid-cols-2 lg:grid">
              {copy.business.map((f, i) => {
                const Icon = BUSINESS_ICONS[i]!;
                return (
                <div
                  key={f.title}
                  className="flex gap-5 border-b border-white/10 py-7"
                >
                  <Icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-lime"
                    strokeWidth={1.75}
                  />
                  <div>
                    <h3 className="font-display font-semibold text-white">
                      {f.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                      {f.desc}
                    </p>
                  </div>
                </div>
                );
              })}
            </div>

            <div className="mt-12 max-w-2xl">
              <h3 className="font-display text-xl font-semibold text-white">
                {s.teamQuote}
              </h3>

              {/* The three terms that actually decide a company purchase, said
                  before the form rather than on a call. The third one in
                  particular has to be read by the firm and by the employee
                  carrying the card: a number that is not yours should never be
                  a surprise. */}
              <dl className="mt-5 mb-6 space-y-2.5 text-sm">
                <div>
                  <dt className="inline font-medium text-white">
                    {formatUZS(TEAM_SEAT_MONTHLY, lang)} — {s.perSeat}
                  </dt>{" "}
                  <dd className="inline text-white/55">
                    {s.minSeats} {MIN_TEAM_SEATS} {s.seatsWord}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-white">
                    {s.seatBought}
                  </dt>{" "}
                  <dd className="inline text-white/55">
                    {s.seatFrees}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-white">
                    {s.handleIsCompany}
                  </dt>{" "}
                  <dd className="inline text-white/55">
                    {s.handleStays}
                  </dd>
                </div>
              </dl>
              <TeamOrderForm />
            </div>
          </div>
        </section>

        <section className="hidden lg:block border-t border-black/5 bg-black/[0.02] py-14 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-3 text-center text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
              {s.compare}
            </p>
            <h2 className="text-center font-display text-2xl font-semibold tracking-tight sm:text-4xl">
              {s.whyFlex}
            </h2>
            <div className="mt-10 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_50px_-24px_rgba(14,10,27,0.2)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/10 text-left text-flex-black/45">
                      <th className="px-5 py-4 font-medium">{s.feature}</th>
                      <th className="px-5 py-4 text-center font-medium">
                        UNQX
                      </th>
                      <th className="px-5 py-4 text-center font-medium">
                        Popl
                      </th>
                      <th className="bg-lime/10 px-5 py-4 text-center font-semibold text-flex-black">
                        Flex
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row, i) => (
                      <tr
                        key={copy.comparison[i]}
                        className={`border-b border-black/5 last:border-0 ${i % 2 === 1 ? "bg-black/[0.015]" : ""}`}
                      >
                        <td className="px-5 py-4">{copy.comparison[i]}</td>
                        <td className="px-5 py-4 text-center">
                          {row.unqx ? (
                            <Check className="mx-auto h-4 w-4 text-flex-black/50" />
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-flex-black/20" />
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {row.popl ? (
                            <Check className="mx-auto h-4 w-4 text-flex-black/50" />
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-flex-black/20" />
                          )}
                        </td>
                        <td className="bg-lime/10 px-5 py-4 text-center">
                          {row.flex ? (
                            <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-lime">
                              <Check
                                className="h-4 w-4 text-flex-black"
                                strokeWidth={3}
                              />
                            </span>
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-flex-black/20" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

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
                    {s.eventMode}
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
