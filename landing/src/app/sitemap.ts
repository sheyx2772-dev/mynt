import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { DEVICES } from "@/lib/devices";
import { languagesFor, localeUrl } from "@/lib/seo";

// Every page of the site, in every language it is written in.
//
// One entry per address rather than one per page: the three translations are
// three URLs, and Google only treats them as one cluster if each of them is
// listed carrying the whole set of alternates. A sitemap with only the Uzbek
// address and an hreflang beside it says the other two exist; it does not say
// they may be indexed.
//
// PROFILES ARE NOT HERE, AND THAT IS THE DECISION THIS FILE EXISTS TO RECORD.
//
// A sitemap listing every handle is a machine-readable list of every customer:
// who bought, when they bought, how many there are, and — since the address is
// the number — which numbers are sold. That is a competitor's market research
// and a scraper's input file, published by us, in one fetch. The old site
// listed claimed handles; that was a smaller site with the same problem.
//
// It is not needed for the profiles to be found. `/residents` links every
// profile whose owner asked to be listed, and that page is in this sitemap —
// so a crawler reaches exactly the profiles their owners agreed to publish, by
// following a link, which is the mechanism consent is already expressed
// through. A profile nobody linked is a page its owner shares by handing
// somebody a card, and it stays that way.
//
// `/p/...` never appears here in any form. It is where `proxy.ts` rewrites to
// internally; the address is `arend.uz/VIP777` and there is only one of it.

/**
 * Stamped with the release rather than with `new Date()`.
 *
 * These pages change when somebody edits them, which is a deploy. A lastmod
 * that moves every time a crawler asks says every page changed the moment it
 * was fetched, which is how a lastmod stops being read at all.
 */
const RELEASED = new Date(process.env.BUILD_DATE ?? "2026-09-06T00:00:00Z");

/**
 * The pages, in the order of what they are worth to somebody arriving cold.
 *
 * Adding a page is a line here. A page that does not exist yet is not a line:
 * a sitemap that lists a 404 spends a crawl on nothing and is counted against
 * the site, so a page joins this list on the day it answers rather than on the
 * day it is linked from the footer.
 *
 * Three of the pages that do answer are deliberately absent. `/login` and
 * `/cabinet` are doors rather than pages — one carries single-use codes, the
 * other is somebody's own data behind a session, and `robots.ts` keeps
 * crawlers off both. `/feed` is a third case: it exists, it is public in the
 * sense that anybody may open it, but it is a different page for every reader
 * and says `robots: { index: false }` itself. Listing a page that asks not to
 * be indexed is the sitemap contradicting the page.
 */
const PAGES = [
  { href: "/", changeFrequency: "weekly", priority: 1 },
  // The two halves of the fork. The entry page explains neither at length, so
  // these are what a search for "NFC vizitka" or "kafe menyu NFC" should land
  // on rather than the front door.
  { href: "/personal", changeFrequency: "monthly", priority: 0.9 },
  { href: "/business", changeFrequency: "monthly", priority: 0.9 },
  // What a buyer looks for before paying.
  { href: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { href: "/devices", changeFrequency: "monthly", priority: 0.8 },
  { href: "/catalogue", changeFrequency: "monthly", priority: 0.8 },
  // The directory: the one page that links the profiles their owners chose to
  // publish, and the only route into them a crawler is given.
  { href: "/residents", changeFrequency: "daily", priority: 0.7 },
  // Low, and listed anyway. Nobody searches for a public offer — but a payment
  // provider reads one before it will route money to a site, and it looks for
  // it the way everybody else finds a page.
  { href: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { href: "/offer", changeFrequency: "yearly", priority: 0.4 },
  { href: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { href: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  // One page per object, each carrying its own price. A search for "NFC uzuk"
  // or "avtovizitka" should reach the object, not the shelf above it.
  ...DEVICES.map((device) => ({
    href: `/devices/${device.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  })),
] as const satisfies ReadonlyArray<{
  href: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap(({ href, changeFrequency, priority }) => {
    const languages = languagesFor(href);

    return routing.locales.map((locale) => ({
      url: localeUrl(href, locale),
      alternates: { languages },
      lastModified: RELEASED,
      changeFrequency,
      priority,
    }));
  });
}
