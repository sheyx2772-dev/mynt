import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";

import HandlePicker from "@/components/ui/paper/HandlePicker";
import LangSwitch from "@/components/LangSwitch";
import MobileMenu from "@/components/MobileMenu";
import Plate from "@/components/ui/Plate";
import { paperButton } from "@/components/ui/paper/Button";
import { COMPANY, DELIVERY } from "@/lib/company";
import { DEVICE_TYPES } from "@/lib/devices";
import { formatNumber, formatUZS } from "@/lib/format";
import { getDirectoryCounts, listNewestResidents } from "@/lib/handles";
import { catalogue, site } from "@/lib/i18n";
import { home } from "@/lib/i18n-home";
import { getLang } from "@/lib/lang";
import { BASE_PRICE } from "@/lib/pricing";
import { PLANS, TEAM_SEAT_MONTHLY } from "@/lib/plans";
import { VENUE_BANDS } from "@/lib/venues";

// The front page.
//
// It used to be dark, and dark was the wrong answer. Somebody buying an NFC
// card in Uzbekistan is not buying technology — they are asking whether this
// works, whether it is a trick, and whether the company will still exist next
// year. None of those are answered by a black background. They are answered by
// showing things: a real face, a real place, a real price, a real address, and
// a way to try the product before paying for it.
//
// So this is the paper face: white, bordered, no texture, one accent. The only
// dark block on the page is the one that shows the owner's cabinet, where dark
// is what the reader would actually see.
//
// Lime is rationed down the page — hero, the middle pricing column, the final
// field — and nothing else on this page is ever lime. Not an icon, not a rule
// under a heading, not a hover state.

// A profile that exists, so the demo cannot show a menu that does not. If it is
// ever released the block degrades to a link rather than breaking.
const DEMO_HANDLE = "NAV001";

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
  const cat = catalogue(lang);

  const [newest, counts] = await Promise.all([
    listNewestResidents(5),
    getDirectoryCounts(),
  ]);

  const premium = PLANS.find((p) => p.id === "premium")!;

  // The three manufactured things carry real prices from the same constants
  // the checkout reads. The rest are quoted, and say so rather than inventing
  // a number the order form would then disagree with.
  const devices = [
    ...DEVICE_TYPES.map((d) => ({
      name: cat.devices[d.id].name,
      note: cat.devices[d.id].tagline,
      price: formatUZS(d.price, lang),
      photo:
        d.id === "card"
          ? "/mahsulot/karta.jpg"
          : d.id === "ring"
            ? "/mahsulot/uzuk.jpg"
            : "/mahsulot/braslet.jpg",
      href: `/qurilmalar/${d.id}`,
    })),
    {
      name: lang === "ru" ? "Автовизитка" : lang === "en" ? "Windscreen tag" : "Avtovizitka",
      note:
        lang === "ru"
          ? "На стекло, сообщение без номера"
          : lang === "en"
            ? "On the glass, a message with no number"
            : "Oynaga, raqamsiz xabar",
      price: h.priceOnRequest,
      photo: "/mahsulot/avtovizitka.jpg",
      href: "/qurilmalar",
    },
    {
      name: lang === "ru" ? "Жетон для животного" : lang === "en" ? "Pet tag" : "Hayvon tegi",
      note:
        lang === "ru"
          ? "На ошейник, сообщение хозяину"
          : lang === "en"
            ? "On the collar, a message to the owner"
            : "Bo'yinbog'ga, egasiga xabar",
      price: h.priceOnRequest,
      photo: "/mahsulot/hayvon-teg.jpg",
      href: "/qurilmalar",
    },
    {
      name: lang === "ru" ? "Настольное устройство" : lang === "en" ? "Table stand" : "Stol qurilmasi",
      note:
        lang === "ru"
          ? "Для кафе и ресторанов"
          : lang === "en"
            ? "For cafes and restaurants"
            : "Kafe va restoranlar uchun",
      price: h.priceOnRequest,
      photo: "/mahsulot/kafe-stend.jpg",
      href: "/biznes",
    },
  ];

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

  const navItems = [
    { href: "/shaxsiy", label: h.navPersonal },
    { href: "/biznes", label: h.navBusiness },
    { href: "/biznes#obyekt", label: h.navVenue },
    { href: "#narxlar", label: h.navPrices },
    { href: "#savollar", label: h.navFaq },
  ];

  return (
    <div data-surface="paper" className="flex min-h-full flex-col overflow-x-clip">
      {/* 0 — navigation ------------------------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-[2px]">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <MobileMenu
              openLabel={s.menuOpen}
              closeLabel={s.menuClose}
              cta={{ href: "#raqam", label: h.navCta }}
              items={[
                ...navItems,
                { href: "/qurilmalar", label: s.navDevices },
                { href: "/rezidentlar", label: s.navResidents },
                { href: "/kabinet", label: s.navCabinet },
              ]}
            >
              <LangSwitch lang={lang} next="/" tone="light" />
            </MobileMenu>
            <Link href="/" className="text-[18px] font-semibold tracking-tight">
              FLEX
            </Link>
          </div>

          <nav className="hidden gap-7 text-[14px] font-medium text-ink-2 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* The phone number is on the bar, visible, because here that is
                what tells somebody a company is real. */}
            <a
              href={`tel:${COMPANY.phoneHref}`}
              className="num hidden text-[14px] font-medium text-ink-2 transition-colors hover:text-ink md:block"
            >
              {COMPANY.phone}
            </a>
            <div className="hidden lg:block">
              <LangSwitch lang={lang} next="/" tone="light" />
            </div>
            {/* Secondary, always. The hero already owns this viewport's lime,
                and two lime buttons on one screen mean neither is the answer. */}
            <a href="#raqam" className={`${paperButton.secondary} h-10 px-4 text-[14px]`}>
              {h.navCta}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 1 — hero ---------------------------------------------------- */}
        <section className="mx-auto max-w-[1120px] px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <p className="text-[13px] leading-[18px] text-ink-3">{h.heroEyebrow}</p>

              <h1 className="mt-3 font-display text-[36px] leading-[40px] font-bold tracking-[-0.02em] text-balance sm:text-[48px] sm:leading-[52px] lg:text-[56px] lg:leading-[60px]">
                {h.heroTitle}
              </h1>

              <p className="mt-5 max-w-[34ch] text-[18px] leading-[26px] text-ink-2 sm:text-[20px] sm:leading-[28px]">
                {h.heroLead}
              </p>

              <div className="mt-7 flex items-center gap-3">
                <Plate n="AAA000" size="lg" />
                <span className="max-w-[16ch] text-[13px] leading-[18px] text-ink-3">
                  {h.heroPlateNote}
                </span>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#raqam" className={`${paperButton.primary} w-full sm:w-auto`}>
                  {h.heroPrimary} — {formatUZS(BASE_PRICE, lang)}
                  {lang === "uz" ? "dan" : ""}
                </a>
                <a href="#sinash" className={`${paperButton.secondary} w-full sm:w-auto`}>
                  {h.heroSecondary}
                </a>
              </div>

              <p className="mt-5 text-[13px] leading-[18px] text-ink-3">
                {h.heroFacts.join(" · ")}
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-card border border-line bg-white">
                <Image
                  src="/mahsulot/tegizish.jpg"
                  alt={h.heroPhotoAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 440px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

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

        {/* 4 — the things that carry it -------------------------------- */}
        <section className="border-y border-line bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-[28px] leading-[32px] font-semibold tracking-[-0.01em]">
                {h.devicesTitle}
              </h2>
              <Link
                href="/qurilmalar"
                className="shrink-0 text-[14px] font-medium text-ink-2 transition-colors hover:text-ink"
              >
                {h.devicesAll} →
              </Link>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {devices.map((d) => (
                <li key={d.name}>
                  <Link
                    href={d.href}
                    className="block rounded-card border border-line bg-white p-4 transition-colors hover:border-line-2"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-input bg-paper">
                      <Image
                        src={d.photo}
                        alt={d.name}
                        fill
                        sizes="(min-width: 1024px) 340px, 45vw"
                        className="object-cover"
                      />
                    </div>
                    <h3 className="mt-3 text-[17px] leading-6 font-semibold">{d.name}</h3>
                    <p className="mt-0.5 text-[13px] leading-[18px] text-ink-3">
                      {d.note}
                    </p>
                    <p className="num mt-2 text-[16px] leading-6 font-semibold">
                      {d.price}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5 — the three audiences ------------------------------------- */}
        {/* The one dark block on the page, and dark for a reason: what it
            shows is the owner's cabinet, which really is dark. */}
        <section className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 sm:py-24">
          <div
            data-surface="ink"
            className="rounded-tile px-6 py-12 sm:px-10 sm:py-14"
          >
            <h2 className="font-display text-[28px] leading-[32px] font-semibold tracking-[-0.01em] text-paper">
              {h.audienceTitle}
            </h2>

            <div className="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-8">
              {h.audiences.map((a) => (
                <div key={a.name}>
                  <h3 className="text-[17px] leading-6 font-semibold text-paper">
                    {a.name}
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {a.points.map((p) => (
                      <li
                        key={p}
                        className="flex gap-2.5 text-[15px] leading-[22px] text-paper-2"
                      >
                        <span
                          aria-hidden
                          className="mt-2 h-1 w-1 shrink-0 rounded-full bg-paper-3"
                        />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={a.href}
                    className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg border border-ink-line bg-ink-s2 px-4 text-[14px] font-semibold text-paper transition-colors hover:border-paper-3"
                  >
                    {h.audienceMore}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
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

        {/* 9 — questions ------------------------------------------------ */}
        <section
          id="savollar"
          className="mx-auto max-w-[720px] scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24"
        >
          <h2 className="font-display text-[28px] leading-[32px] font-semibold tracking-[-0.01em]">
            {h.faqTitle}
          </h2>
          <div className="mt-6">
            {h.faqs.map((item) => (
              <details key={item.q} className="group border-b border-line">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[16px] leading-6 font-medium marker:content-none">
                  {item.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-ink-3 transition-transform duration-[200ms] group-open:rotate-180" />
                </summary>
                <p className="pb-4 text-[16px] leading-6 text-ink-2">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 10 — the number, typed in ------------------------------------ */}
        <section
          id="raqam"
          className="scroll-mt-20 border-t border-line bg-white py-16 text-center sm:py-24"
        >
          <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
            <h2 className="font-display text-[32px] leading-[36px] font-semibold tracking-[-0.01em] sm:text-[36px] sm:leading-[40px]">
              {h.finalTitle}
            </h2>
            <div className="mt-8">
              <HandlePicker
                labels={{
                  letters: h.finalLetters,
                  digits: h.finalDigits,
                  submit: h.finalSubmit,
                  error: h.finalError,
                  hint: h.finalHint,
                }}
              />
            </div>
          </div>
        </section>
      </main>

      {/* 11 — footer ---------------------------------------------------- */}
      {/* The legal name, the tax number and a street address are not
          decoration here: a shop without them does not get paid online. */}
      <footer className="border-t border-line pt-12 pb-10">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <div className="grid gap-8 text-[13px] leading-[18px] sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[12px] leading-4 font-medium tracking-[0.04em] text-ink-3 uppercase">
                {h.footProduct}
              </p>
              <ul className="mt-3 space-y-1 text-ink-2">
                <li>
                  <Link href="/shaxsiy" className="block py-1 hover:text-ink">
                    {h.navPersonal}
                  </Link>
                </li>
                <li>
                  <Link href="/qurilmalar" className="block py-1 hover:text-ink">
                    {s.navDevices}
                  </Link>
                </li>
                <li>
                  <Link href="/rezidentlar" className="block py-1 hover:text-ink">
                    {s.navResidents}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[12px] leading-4 font-medium tracking-[0.04em] text-ink-3 uppercase">
                {h.footBusiness}
              </p>
              <ul className="mt-3 space-y-1 text-ink-2">
                <li>
                  <Link href="/biznes" className="block py-1 hover:text-ink">
                    {s.venueLine}
                  </Link>
                </li>
                <li>
                  <Link href="/biznes#jamoa" className="block py-1 hover:text-ink">
                    {s.teamCards}
                  </Link>
                </li>
                <li>
                  <Link href="#narxlar" className="block py-1 hover:text-ink">
                    {h.navPrices}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[12px] leading-4 font-medium tracking-[0.04em] text-ink-3 uppercase">
                {h.footHelp}
              </p>
              <ul className="mt-3 space-y-1 text-ink-2">
                <li>
                  <a href="#savollar" className="block py-1 hover:text-ink">
                    {h.navFaq}
                  </a>
                </li>
                <li>
                  <Link href="/shartlar" className="block py-1 hover:text-ink">
                    {s.delivery}
                  </Link>
                </li>
                <li>
                  <Link href="/kabinet" className="block py-1 hover:text-ink">
                    {s.navCabinet}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[12px] leading-4 font-medium tracking-[0.04em] text-ink-3 uppercase">
                {h.footCompany}
              </p>
              <address className="mt-3 space-y-1 text-ink-2 not-italic">
                <p>{COMPANY.legalName}</p>
                <p className="num">
                  {h.footInn} {COMPANY.inn}
                </p>
                <p>{COMPANY.address}</p>
                <p>
                  <a href={`tel:${COMPANY.phoneHref}`} className="num hover:text-ink">
                    {COMPANY.phone}
                  </a>
                </p>
                <p>
                  <a href={`mailto:${COMPANY.email}`} className="hover:text-ink">
                    {COMPANY.email}
                  </a>
                </p>
                <p className="text-ink-3">{h.footHours}</p>
                <p className="text-ink-3">
                  {lang === "ru"
                    ? `Ташкент — ${DELIVERY.tashkentDays} день, области — ${DELIVERY.regionsDaysFrom}–${DELIVERY.regionsDaysTo} дня`
                    : lang === "en"
                      ? `Tashkent in ${DELIVERY.tashkentDays} day, regions in ${DELIVERY.regionsDaysFrom}–${DELIVERY.regionsDaysTo}`
                      : `Toshkent — ${DELIVERY.tashkentDays} kun, viloyatlar — ${DELIVERY.regionsDaysFrom}–${DELIVERY.regionsDaysTo} kun`}
                </p>
              </address>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 text-[13px] leading-[18px] text-ink-3 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} FLEX ·{" "}
              <Link href="/shartlar" className="hover:text-ink">
                {h.footOffer}
              </Link>
            </p>
            <LangSwitch lang={lang} next="/" tone="light" />
          </div>
        </div>
      </footer>
    </div>
  );
}
