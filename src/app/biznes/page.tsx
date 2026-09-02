import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Inbox, BarChart3 } from "lucide-react";

import Mark from "@/components/Mark";
import LangSwitch from "@/components/LangSwitch";
import VenuePicker from "@/components/VenuePicker";
import VenueRequestForm from "@/components/VenueRequestForm";
import { b2b, site } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { productShot } from "@/lib/product-shots";

// The venue product, on its own page.
//
// It could have been another section on the landing page and should not be: a
// restaurant owner arriving from a sales call is not the same reader as
// somebody pricing a personal handle, and making them scroll past the hero to
// reach their own product is the thing this page exists to stop.

const CORE_ICONS = [MapPin, Inbox, BarChart3];

export async function generateMetadata({
  searchParams,
}: PageProps<"/biznes">): Promise<Metadata> {
  const { til } = await searchParams;
  const t = b2b(await getLang(til));
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function BusinessPage({ searchParams }: PageProps<"/biznes">) {
  const { til } = await searchParams;
  const lang = await getLang(til);
  const t = b2b(lang);
  const s = site(lang);
  const heroShot = productShot("biznes");

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
            <LangSwitch lang={lang} next="/biznes" tone="dark" />
            <a
              href="#sorov"
              className="rounded-full bg-lime px-4 py-2 text-sm font-medium text-flex-black transition-colors hover:bg-lime/85"
            >
              {t.formEyebrow}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="grain relative overflow-hidden bg-flex-black text-white">
          <div className="bg-dot-grid-light absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_0%,black,transparent)]" />
          <div className="absolute -top-40 left-1/4 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-lime/[0.13] blur-[130px]" />

          <div className="relative mx-auto grid max-w-6xl gap-10 px-6 pt-12 pb-14 sm:pt-20 sm:pb-20 lg:grid-cols-[1fr_320px] lg:items-center lg:gap-16">
            <div>
            <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
              {t.eyebrow}
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-[2.1rem] leading-[1.06] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>
            <p className="mt-6 max-w-xl leading-relaxed text-white/60 sm:text-lg">
              {t.lede}
            </p>

            {/* What the address points at today, and what it will point at. */}
            <div className="mt-9 flex flex-wrap items-center gap-2 font-display text-sm">
              <span className="rounded-xl border border-lime/40 bg-white/[0.05] px-3.5 py-2 text-lime">
                {t.chain[0]}
              </span>
              <span className="text-xs text-white/30">{t.chainNow}</span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 font-display text-sm">
              {t.chain.slice(1).map((step) => (
                <span
                  key={step}
                  className="rounded-xl border border-white/12 bg-white/[0.05] px-3.5 py-2 text-white/75"
                >
                  {step}
                </span>
              ))}
              <span className="text-xs text-white/30">{t.chainNext}</span>
            </div>
            </div>

            {/* The product in a real room. Absent is a working state — the
                column simply does not render. */}
            {heroShot && (
              <div className="relative aspect-[3/4] overflow-hidden rounded-[1.8rem] ring-1 ring-white/10">
                <Image
                  src={heroShot}
                  alt={t.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 320px, 100vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white" />
        </section>

        {/* Said plainly and near the top, because everything below describes
            something being built rather than something already switched on. */}
        <section className="mx-auto max-w-6xl px-6 pt-12">
          <div className="rounded-3xl border-l-[3px] border-lime-ink bg-black/[0.03] px-6 py-5">
            <h2 className="font-display font-semibold">{t.pilotTitle}</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-flex-black/65">
              {t.pilotBody}
            </p>
          </div>
        </section>

        {/* The shared layer */}
        <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <p className="text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
            {t.coreEyebrow}
          </p>
          <h2 className="mt-3 max-w-lg font-display text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t.coreTitle}
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-flex-black/60">{t.coreLede}</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {t.core.map((item, i) => {
              const Icon = CORE_ICONS[i]!;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-black/10 bg-white p-6"
                >
                  <Icon className="h-5 w-5 text-flex-black/35" strokeWidth={1.75} />
                  <h3 className="mt-5 font-display font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-flex-black/60">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Vertical picker + price */}
        <section className="border-t border-black/5 bg-black/[0.02] py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
              {t.priceEyebrow}
            </p>
            <h2 className="mt-3 max-w-lg font-display text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
              {t.priceTitle}
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-flex-black/60">{t.priceLede}</p>

            <div className="mt-10">
              <VenuePicker
                t={t}
                lang={lang}
                shots={{
                  cafe: [productShot("kafe")].filter(Boolean) as string[],
                  hotel: [productShot("mehmonxona")].filter(Boolean) as string[],
                  auto: [productShot("avto"), productShot("avtovizitka")].filter(
                    Boolean,
                  ) as string[],
                  other: [productShot("salon")].filter(Boolean) as string[],
                }}
              />
            </div>
          </div>
        </section>

        {/* The rest of the verticals */}
        <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <p className="text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
            {t.otherEyebrow}
          </p>
          <h2 className="mt-3 max-w-lg font-display text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t.otherTitle}
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-flex-black/60">{t.otherLede}</p>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[38rem] border-collapse text-sm">
              <thead>
                <tr>
                  {t.tableHead.map((head) => (
                    <th
                      key={head}
                      className="border-b border-black/10 px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-flex-black/40 uppercase"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.others.map((row) => (
                  <tr key={row[0]}>
                    <td className="border-b border-black/8 px-4 py-3.5 font-medium">
                      {row[0]}
                    </td>
                    <td className="border-b border-black/8 px-4 py-3.5 text-flex-black/60">
                      {row[1]}
                    </td>
                    <td className="border-b border-black/8 px-4 py-3.5 text-flex-black/60">
                      {row[2]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Enquiry */}
        <section
          id="sorov"
          className="grain relative scroll-mt-20 overflow-hidden bg-flex-black py-14 text-white sm:py-20"
        >
          <div className="bg-dot-grid-light absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
          <div className="relative mx-auto max-w-3xl px-6">
            <p className="text-xs font-semibold tracking-widest text-lime/70 uppercase">
              {t.formEyebrow}
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
              {t.formTitle}
            </h2>
            <p className="mt-3 text-white/55">{t.formLede}</p>

            <div className="mt-9">
              <VenueRequestForm t={t} />
            </div>
          </div>
        </section>

        {/* The other B2B offer, which lives on the landing page */}
        <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <div className="rounded-3xl border border-black/10 bg-white p-8 sm:p-10">
            <p className="text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
              {t.teamEyebrow}
            </p>
            <h2 className="mt-3 max-w-md font-display text-xl font-semibold tracking-tight text-balance sm:text-2xl">
              {t.teamTitle}
            </h2>
            <p className="mt-3 max-w-xl leading-relaxed text-flex-black/60">{t.teamBody}</p>
            <Link
              href="/#biznes"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-flex-black px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.02]"
            >
              {t.teamCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/8 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-flex-black/45">
          <Link href="/" className="hover:text-flex-black">
            flex.com.uz
          </Link>
          <Link href="/shartlar" className="hover:text-flex-black">
            {s.footerTerms}
          </Link>
        </div>
      </footer>
    </div>
  );
}
