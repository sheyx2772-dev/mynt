import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import LegalLink from "@/components/legal/LegalLink";
import LegalPage from "@/components/legal/LegalPage";
import { routing } from "@/i18n/routing";
import { pageSeo } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // Its own address, and the same page in the other two languages.
    ...pageSeo("/privacy", locale),
  };
}

// What is collected, and who can see it.
//
// The second clause is the one that matters and it is why it comes before the
// list of purposes: a Flex profile is a public, indexable page, and a policy
// that buries that under a paragraph about lawful bases has misled somebody
// about the only thing they could not work out for themselves. Everything
// listed here is something the product demonstrably does — the two cookies are
// `routing.localeCookie` and the session, the enquiry fields are the ones
// `business/actions.ts` validates. Nothing is claimed that the code does not
// do.
export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

  const sections = [
    {
      id: "collected",
      title: t("s1title"),
      body: [t("s1p1"), t("s1p2"), t("s1p3"), t("s1p4"), t("s1p5"), t("s1p6")],
    },
    { id: "public", title: t("s2title"), body: [t("s2p1"), t("s2p2")] },
    { id: "why", title: t("s3title"), body: [t("s3p1"), t("s3p2")] },
    {
      id: "shared",
      title: t("s4title"),
      body: [t("s4p1"), t("s4p2"), t("s4p3")],
    },
    { id: "cookies", title: t("s5title"), body: [t("s5p1"), t("s5p2")] },
    {
      id: "retention",
      title: t("s6title"),
      body: [t("s6p1"), t("s6p2"), t("s6p3")],
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
      lead={t("lead")}
      updatedLabel={t("updatedLabel")}
      locale={locale}
      tocLabel={t("tocLabel")}
      authority={t("authority")}
      sections={sections}
    />
  );
}
