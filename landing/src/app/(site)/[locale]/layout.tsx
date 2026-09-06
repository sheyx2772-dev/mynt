import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { routing } from "@/i18n/routing";
import { inter, mono, serif } from "../../fonts";
import "../../globals.css";

// The site: every marketing page, under a language it announces in its path.
//
// It carries `<html>` itself rather than inheriting one from `app/layout.tsx`,
// because `lang` is a translated value and a layout above this could not read
// the segment that decides it. `(profile)` carries its own for the same reason
// and a stronger one — it is a different document with none of this chrome.

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });

  return {
    title: { default: t("name"), template: `%s — ${t("name")}` },
    description: t("tagline"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  // The segment is whatever was typed. `/xx` must be a 404 rather than a page
  // rendered in the default language at an address that will never be right.
  if (!hasLocale(routing.locales, locale)) notFound();

  // Told before anything renders, so a statically rendered page reads the same
  // language its address promised.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${mono.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Messages reach client components through this. Server components
            do not need it — they await `getTranslations()` and are rendered
            before anything is sent. */}
        <NextIntlClientProvider>
          {/* One header and one footer, here rather than in a page. The site
              this replaces had fourteen pages each drawing their own, which is
              how one product ends up wearing two uniforms.

              `session` is not read yet — the backend client lands with auth.
              Passing it explicitly keeps the signed-in markup in the tree and
              exercised the day it arrives, rather than written later against a
              header nobody has looked at since. */}
          <SiteHeader session={null} />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
