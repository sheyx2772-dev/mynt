import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SiteJsonLd from "@/components/SiteJsonLd";
import { routing } from "@/i18n/routing";
import { languagesFor, ogLocale } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
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
    // Every relative address below and in every page under this layout is
    // resolved against this. Without it Next builds `og:image` from whatever
    // origin the container answers on, which is `localhost:3000` — a picture
    // no chat client can fetch, on the tag whose whole job is to be fetched by
    // one. The origin is the configured one, never a request header.
    metadataBase: new URL(SITE_URL),
    title: { default: t("name"), template: `%s — ${t("name")}` },
    description: t("tagline"),

    // The entry page's three addresses, and the one that negotiates.
    //
    // This is the entry page's cluster rather than the site's, because a layout
    // is rendered for every page under it and cannot know which one it is
    // rendering. Every other page states its own with `pageSeo`, which replaces
    // this block wholesale — metadata is merged one field deep, so a page that
    // sets `alternates` sets all of it.
    //
    // Which is exactly why there is no `canonical` here. Inherited by a page
    // that forgot its own, a canonical would tell a crawler that the pricing
    // page IS the entry page, and Google would drop the pricing page. An
    // inherited hreflang is the same mistake with a survivable outcome: the
    // annotations are not reciprocated, so they are ignored rather than obeyed.
    alternates: { languages: languagesFor("/") },

    openGraph: {
      type: "website",
      siteName: t("name"),
      locale: ogLocale(locale),
      // No `title`, `description` or `url`: Next fills the first two from the
      // page's own, and a URL written here would be the entry page's on every
      // page that did not replace this block.
    },
    twitter: {
      // The large card is the one that shows the picture at a size worth
      // having; `summary` crops it to a thumbnail beside the text. X reads
      // `og:image` when no twitter image is given, which is what the generated
      // card in `opengraph-image.tsx` is.
      card: "summary_large_image",
    },
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
        {/* Who publishes this, once per page and in the only form a crawler
            reads it in. It draws nothing. */}
        <SiteJsonLd />

        {/* Messages reach client components through this. Server components
            do not need it — they await `getTranslations()` and are rendered
            before anything is sent. */}
        <NextIntlClientProvider>
          {/* One header and one footer, here rather than in a page. The site
              this replaces had fourteen pages each drawing their own, which is
              how one product ends up wearing two uniforms. */}
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
