import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Link2, Nfc, Sparkles, BarChart3, Car } from "lucide-react";

import Mark from "@/components/Mark";
import LangSwitch from "@/components/LangSwitch";
import HandleChecker from "@/components/HandleChecker";
import HeroStage from "@/components/HeroStage";
import PhoneFrame from "@/components/PhoneFrame";
import ProfilePreview from "@/components/ProfilePreview";
import PricingCalculator from "@/components/PricingCalculator";
import PlanTable from "@/components/PlanTable";
import { site, landing, catalogue } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { productShot } from "@/lib/product-shots";
import { formatUZS } from "@/lib/format";
import { DEVICE_TYPES } from "@/lib/devices";

// The personal product, whole, on one page.
//
// It used to be five sections scattered down the entry page between the
// business pitch and the comparison table: the offer, the three steps, what a
// profile looks like, the calculator, the plans. Somebody who chose "Shaxsiy"
// had to assemble the answer themselves out of pieces separated by things
// meant for somebody else. Now they read one page and buy.

const CONSUMER_ICONS = [Link2, Nfc, Sparkles, BarChart3, Car];

export async function generateMetadata({
  searchParams,
}: PageProps<"/shaxsiy">): Promise<Metadata> {
  const { til } = await searchParams;
  const s = site(await getLang(til));
  return { title: `${s.wayPersonal} — flex.com.uz`, description: s.wayPersonalDesc };
}

export default async function PersonalPage({ searchParams }: PageProps<"/shaxsiy">) {
  const { til } = await searchParams;
  const lang = await getLang(til);
  const s = site(lang);
  const copy = landing(lang);
  const c = catalogue(lang);

  const tapShot = productShot("tegizish");
  const familyShot = productShot("oila");
  const carShot = productShot("avtovizitka");

  return (
    <div className="flex min-h-full flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-flex-black/85 text-white backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight"
          >
            <Mark className="h-7 w-7" tone="dark" />
            flex
          </Link>
          <div className="flex items-center gap-3">
            <LangSwitch lang={lang} next="/shaxsiy" tone="dark" />
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
        <section className="grain relative overflow-hidden bg-flex-black text-white">
          <div className="bg-dot-grid-light absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
          <div className="absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-lime/[0.13] blur-[140px]" />

          <div className="relative mx-auto max-w-6xl px-6 pt-10 pb-16 sm:pt-28 sm:pb-28">
            <div className="grid items-center gap-10 sm:gap-16 lg:grid-cols-2">
              <div>
                {/* The brand line moved above, to the fork. What is left here
                    is the personal offer, which is what this band was always
                    arguing for — so the lead becomes the statement. */}
                <p className="max-w-lg font-display text-2xl leading-snug font-medium tracking-tight text-balance text-white/85 sm:text-3xl">
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
                  <Link
                    href="/biznes"
                    className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:px-7 sm:py-3.5 sm:text-base"
                  >
                    {s.forBusiness}
                  </Link>
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

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-6 py-14 sm:py-24">
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

              {/* The car card, on the side of the site it belongs to: one
                  person, one car, bought the way a card or a ring is. */}
              {carShot && (
                <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-flex-black">
                  <Image
                    src={carShot}
                    alt={copy.consumer[4]?.title ?? ""}
                    fill
                    sizes="320px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
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
        <section id="tarif" className="mx-auto max-w-6xl px-6 pb-24">
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

      </main>

      <footer className="border-t border-black/8 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-flex-black/45">
          <Link href="/" className="hover:text-flex-black">
            flex.com.uz
          </Link>
          <Link href="/biznes" className="hover:text-flex-black">
            {s.navBusiness}
          </Link>
          <Link href="/shartlar" className="hover:text-flex-black">
            {s.footerTerms}
          </Link>
        </div>
      </footer>
    </div>
  );
}
