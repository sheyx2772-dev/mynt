import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import Bands from "@/components/business/Bands";
import Enquiry from "@/components/business/Enquiry";
import Points from "@/components/business/Points";
import Teams from "@/components/business/Teams";
import VenueSection from "@/components/business/VenueSection";
import { VENUES } from "@/components/business/venues";
import { routing } from "@/i18n/routing";

/** Four trades in three languages, built once at deploy rather than on a tap. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/business">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "business" });

  return { title: t("metaTitle"), description: t("metaDescription") };
}

// Everything sold to somebody who owns a room full of people.
//
// One page rather than four, and the four trades are anchors on it, because
// every existing link into this product already points at an anchor: the entry
// page's tiles go to `#hotels`, `#salons` and `#clinics`, and the footer adds
// `#teams`. Four pages would be four thin pages repeating the same three
// paragraphs about points, inboxes and reports — and a cafe owner who is also
// curious what a hotel gets would have to go and look.
//
// The order is the order of the argument, not of the catalogue: what a point
// is, then each trade answered as guest / owner / price, then the ladder those
// four prices sit on, then the other buyer, then a way to be called back.
const JUMPS = ["cafes", "hotels", "salons", "clinics", "teams"] as const;

export default async function BusinessPage({
  params,
}: PageProps<"/[locale]/business">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("business");

  return (
    <main className="flex-1">
      {/* On the ink, like the business half of the fork on the entry page.
          Somebody arriving from that tile should recognise where they landed
          before reading a word. */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute -top-32 left-1/3 size-[30rem] rounded-full bg-lime/10 blur-[130px]" />

        <div className="relative mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <p className="cap text-lime">{t("eyebrow")}</p>
          <h1 className="mt-3 max-w-3xl text-[34px] leading-10 font-semibold tracking-tight text-balance sm:text-[46px] sm:leading-[3.25rem]">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-xl leading-relaxed text-paper-2">
            {t("lead")}
          </p>

          {/* Plain anchors, not locale links: these go to a section of this
              page, and routing them through the locale helper would rebuild
              the address they are already on. */}
          <nav
            aria-label={t("jumpLabel")}
            className="mt-8 flex flex-wrap gap-2"
          >
            {JUMPS.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-input border border-ink-line bg-white/[0.06] px-3.5 py-2 text-sm text-paper-2 transition-colors hover:border-lime/50 hover:text-white"
              >
                {t(id === "teams" ? "teamsEyebrow" : `${id}Name`)}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <Points />

      {VENUES.map((venue, i) => (
        <VenueSection key={venue.id} venue={venue} flip={i % 2 === 1} />
      ))}

      <Bands />
      <Teams />
      <Enquiry />
    </main>
  );
}
