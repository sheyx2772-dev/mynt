import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Mark from "@/components/Mark";
import { site, landing, picker } from "@/lib/i18n";
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
import LangSwitch from "@/components/LangSwitch";
import { COMPANY } from "@/lib/company";

// Which icon goes with which entry, in the dictionary's order. Kept out of the
// dictionary because an icon is not a translation.

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
  const devices = deviceStrip(lang);
  const verticals = verticalStrip(lang);

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
            {/* The calculator lives on /shaxsiy. This button kept pointing at
                the anchor it left behind, so the largest control on the site
                did nothing at all. */}
            <Link
              href="/shaxsiy#narx"
              className="rounded-full bg-lime px-4 py-2 text-sm font-medium text-flex-black transition-colors hover:bg-lime/85"
            >
              {s.getHandle}
            </Link>
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
                  <Link
                    href="/shaxsiy#narx"
                    className="block py-1.5 transition-colors hover:text-white"
                  >
                    {s.navPricing}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shaxsiy#individual"
                    className="block py-1.5 transition-colors hover:text-white"
                  >
                    {s.personalProfile}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/qurilmalar/card"
                    className="block py-1.5 transition-colors hover:text-white"
                  >
                    FLEX CARD
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                {s.navBusiness}
              </p>
              <ul className="mt-3 space-y-0.5 text-sm text-white/60">
                <li>
                  <Link
                    href="/biznes"
                    className="block py-1.5 transition-colors hover:text-white"
                  >
                    {s.venueLine}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/biznes#jamoa"
                    className="block py-1.5 transition-colors hover:text-white"
                  >
                    {s.teamCards}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shaxsiy#tarif"
                    className="block py-1.5 transition-colors hover:text-white"
                  >
                    {s.contactCollection}
                  </Link>
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
