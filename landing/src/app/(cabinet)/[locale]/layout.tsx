import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { inter, mono } from "../../fonts";
import "../../globals.css";

// The cabinet is its own document, not a page of the site.
//
// `(site)` wears the shop's chrome: a sticky header of pages to buy from and a
// four-column footer of pages already bought from. None of that is what a
// person managing their own number came for, and on a phone it is a screen's
// worth of things to press by accident above the thing they opened. So this
// group carries its own `<html>`, the way `(profile)` does, and puts a
// workbench's chrome on instead — see `cabinet/layout.tsx`.
//
// Two route groups both starting at `[locale]` is one slug name in one
// position, which Next allows; what it refuses is two DIFFERENT names there,
// which is why the profile lives behind a rewrite (`proxy.ts`). The build is
// the proof, not this paragraph.
//
// No serif: the ceremonial face belongs to profiles, and nothing here is a
// certificate.

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cabinet" });
  return {
    title: { default: t("title"), template: `%s — ${t("title")}` },
    // Nobody's cabinet is a page for a search engine, and the address alone
    // says whose it is.
    robots: { index: false, follow: false },
  };
}

export default async function CabinetDocument({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
    >
      {/* Paper, like the site. The profile is dark because it is the card
          carrying on; a workbench of forms and figures is not, and a person
          who came from a light site and goes back to one should not have the
          ground flip under them in between. A theme switcher would not fix
          that — it is a stored preference, a flash of the wrong theme on
          first paint and every component checked twice, which is worth
          building once for the whole site when people ask for dark mode, not
          to paper over a ground nobody chose. */}
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
