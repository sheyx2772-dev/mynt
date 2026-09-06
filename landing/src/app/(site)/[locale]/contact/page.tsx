import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import LegalLink from "@/components/legal/LegalLink";
import Requisites from "@/components/legal/Requisites";
import { routing } from "@/i18n/routing";
import { COMPANY } from "@/lib/company";
import { pageSeo } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // Its own address, and the same page in the other two languages.
    ...pageSeo("/contact", locale),
  };
}

// How to reach a person, and who that person is.
//
// The phone and the mailbox are first and they are links, because most of the
// traffic here is somebody on a phone who wants to press a number rather than
// read a page. The registered address is further down and is not a map link:
// it is a flat, published so a buyer can see who they are paying, and a page
// that offers directions to it is inviting strangers to somebody's door. The
// note beside it says so plainly rather than leaving the reader to find out on
// the doorstep.
export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  const direct = [
    {
      label: t("phoneLabel"),
      value: COMPANY.phone,
      href: `tel:${COMPANY.phoneHref}`,
    },
    {
      label: t("emailLabel"),
      value: COMPANY.email,
      href: `mailto:${COMPANY.email}`,
    },
  ];

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <h1 className="text-[34px] leading-10 font-semibold tracking-tight sm:text-[42px] sm:leading-[3rem]">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-[65ch] text-lg leading-relaxed text-ink-2">
          {t("lead")}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {direct.map((row) => (
            <a
              key={row.label}
              href={row.href}
              className="rounded-tile border border-line bg-white p-6 transition-colors hover:border-line-lead"
            >
              <p className="cap text-ink-3">{row.label}</p>
              <p className="mt-2 font-mono text-lg tracking-[0.06em] break-all">
                {row.value}
              </p>
            </a>
          ))}

          <div className="rounded-tile border border-line bg-white p-6">
            <p className="cap text-ink-3">{t("personLabel")}</p>
            <p className="mt-2 text-lg">{COMPANY.contactPerson}</p>
          </div>

          <div className="rounded-tile border border-line bg-white p-6">
            <p className="cap text-ink-3">{t("replyTitle")}</p>
            <p className="mt-2 leading-relaxed text-ink-2">{t("replyBody")}</p>
          </div>
        </div>
      </div>

      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-xl font-semibold">{t("businessTitle")}</h2>
          <p className="mt-2 max-w-[65ch] leading-relaxed text-ink-2">
            {t("businessBody")}
          </p>
          <LegalLink href="/business">{t("businessCta")}</LegalLink>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <h2 className="text-xl font-semibold">{t("reqTitle")}</h2>
        <p className="mt-2 max-w-[65ch] leading-relaxed text-ink-2">
          {t("reqNote")}
        </p>
        <Requisites />
        {/* Under the table rather than beside the address inside it: the row
            is what an accountant copies, and this is what a person who read it
            as a shop needs to be told before they set off. */}
        <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-ink-3">
          {t("addressNote")}
        </p>

        <h2 className="mt-12 text-xl font-semibold">{t("docsTitle")}</h2>
        <p className="mt-2 max-w-[65ch] leading-relaxed text-ink-2">
          {t("docsBody")}
        </p>
        <div className="flex flex-wrap">
          <LegalLink href="/offer">{t("docsOffer")}</LegalLink>
          <LegalLink href="/terms">{t("docsTerms")}</LegalLink>
          <LegalLink href="/privacy">{t("docsPrivacy")}</LegalLink>
        </div>
      </div>
    </main>
  );
}
