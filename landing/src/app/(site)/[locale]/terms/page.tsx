import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import LegalLink from "@/components/legal/LegalLink";
import LegalPage from "@/components/legal/LegalPage";
import { routing } from "@/i18n/routing";
import { COMPANY } from "@/lib/company";
import { money } from "@/lib/devices";
import { PERSONAL_MONTHLY, PERSONAL_YEARLY } from "@/lib/plans";
import { SITE_HOST } from "@/lib/site";
import { pageSeo } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // Its own address, and the same page in the other two languages.
    ...pageSeo("/terms", locale),
  };
}

// The rules for living with a handle, as opposed to the terms it was bought
// on.
//
// The old site had one document for both, and the two are read by different
// people at different moments: a buyer reads the offer once, before paying,
// and an owner comes back to this one months later to find out how to hand
// their number to somebody else. Splitting them is what lets each be short
// enough to finish.
//
// Clause 5 says a refused combination answers as though it did not exist, and
// deliberately does not say which ones. Printing the list would hand somebody
// hunting for exactly those words a ready-made index of them — the same reason
// `pricing.ts` keeps `BLOCKED_WORDS` out of the copy.
export default async function TermsPage({
  params,
}: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("terms");

  const sections = [
    {
      id: "scope",
      title: t("s1title"),
      body: [t("s1p1", { company: COMPANY.legalName }), t("s1p2")],
      extra: <LegalLink href="/offer">{t("s1link")}</LegalLink>,
    },
    {
      id: "handle",
      title: t("s2title"),
      body: [t("s2p1", { host: SITE_HOST }), t("s2p2")],
    },
    {
      id: "subscription",
      title: t("s3title"),
      // The figures come from `plans.ts`, which is what the backend bills
      // from. A price written into a clause is a price the server will not
      // honour, and a contract is the worst place to discover that.
      body: [
        t("s3p1", {
          monthly: money(PERSONAL_MONTHLY),
          yearly: money(PERSONAL_YEARLY),
        }),
        t("s3p2"),
        t("s3p3"),
      ],
      extra: <LegalLink href="/pricing">{t("s3link")}</LegalLink>,
    },
    { id: "transfer", title: t("s4title"), body: [t("s4p1")] },
    { id: "blocked", title: t("s5title"), body: [t("s5p1"), t("s5p2")] },
    { id: "content", title: t("s6title"), body: [t("s6p1"), t("s6p2")] },
    { id: "changes", title: t("s7title"), body: [t("s7p1")] },
  ];

  return (
    <LegalPage
      title={t("title")}
      lead={t("lead")}
      updatedLabel={t("updatedLabel")}
      locale={locale}
      tocLabel={t("tocLabel")}
      authority={t("authority")}
      sections={sections}
    />
  );
}
