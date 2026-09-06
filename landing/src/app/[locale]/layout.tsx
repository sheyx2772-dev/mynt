import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

import { routing } from "@/i18n/routing";
import "../globals.css";

// Every page in the product hangs under a language.
//
// The root layout lives here rather than at `app/layout.tsx` because `<html
// lang>` is one of the things being translated, and a layout above this one
// would have to guess it before the segment was read.

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
    <html lang={locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {/* Messages reach client components through this. Server components
            do not need it — they await `getTranslations()` and are rendered
            before anything is sent. */}
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
