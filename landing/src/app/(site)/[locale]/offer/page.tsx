import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import LegalLink from "@/components/legal/LegalLink";
import LegalPage from "@/components/legal/LegalPage";
import Requisites from "@/components/legal/Requisites";
import { routing } from "@/i18n/routing";
import {
  COMPANY,
  DELIVERY,
  HOLD_MINUTES,
  REPLACEMENT_WINDOW_DAYS,
} from "@/lib/company";
import { money } from "@/lib/devices";
import { BASE_PRICE } from "@/lib/pricing";
import { SITE_HOST } from "@/lib/site";
import { pageSeo } from "@/lib/seo";

// Nothing here depends on a request: the seller, the prices and the delivery
// windows are constants, so all three languages are rendered once at build.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/offer">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "offer" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // Its own address, and the same page in the other two languages.
    ...pageSeo("/offer", locale),
  };
}

// The contract of sale.
//
// Split out of the old site's single "oferta va shartlar" page, which asked a
// buyer working out whether a card is refundable to read past the subscription
// tiers to find out. This document answers one question — what is being sold,
// on what terms, by whom — and the rules for living with the thing afterwards
// are in `/terms`.
//
// Every figure is interpolated from the constant the rest of the site prices
// from. A price typed into a contract is a price that goes stale silently, and
// the version a buyer can point at is this one.
export default async function OfferPage({
  params,
}: PageProps<"/[locale]/offer">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("offer");

  const sections = [
    {
      id: "service",
      title: t("s1title"),
      body: [t("s1p1", { host: SITE_HOST }), t("s1p2")],
    },
    {
      id: "prices",
      title: t("s2title"),
      body: [t("s2p1", { base: money(BASE_PRICE) }), t("s2p2")],
      // Linked rather than tabulated. The device shelf and the plans already
      // print their own prices; a second table here is a second number to keep
      // right, and the one that goes stale is always the one in the contract.
      extra: (
        <>
          <LegalLink href="/pricing">{t("s2linkPricing")}</LegalLink>
          <LegalLink href="/devices">{t("s2linkDevices")}</LegalLink>
        </>
      ),
    },
    {
      id: "payment",
      title: t("s3title"),
      body: [t("s3p1", { minutes: HOLD_MINUTES }), t("s3p2")],
    },
    {
      id: "delivery",
      title: t("s4title"),
      body: [
        t("s4p1", {
          tashkent: DELIVERY.tashkentDays,
          from: DELIVERY.regionsDaysFrom,
          to: DELIVERY.regionsDaysTo,
        }),
        t("s4p2"),
      ],
    },
    {
      id: "returns",
      title: t("s5title"),
      body: [
        t("s5p1"),
        t("s5p2", { days: REPLACEMENT_WINDOW_DAYS }),
        t("s5p3"),
      ],
    },
    {
      id: "seller",
      title: t("s6title"),
      body: [t("s6p1")],
      extra: <Requisites />,
    },
    {
      id: "contact",
      title: t("s7title"),
      body: [t("s7p1")],
      extra: <LegalLink href="/contact">{t("s7link")}</LegalLink>,
    },
  ];

  return (
    <LegalPage
      title={t("title")}
      lead={t("lead", {
        company: COMPANY.legalName,
        days: REPLACEMENT_WINDOW_DAYS,
      })}
      updatedLabel={t("updatedLabel")}
      locale={locale}
      tocLabel={t("tocLabel")}
      authority={t("authority")}
      sections={sections}
    />
  );
}
