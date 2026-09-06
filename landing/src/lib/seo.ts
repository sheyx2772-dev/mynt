import type { Metadata } from "next";

import { hasLocale } from "next-intl";

import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { SITE_URL } from "./site";

// What a page tells a crawler about itself, and what a chat client shows when
// somebody pastes its address.
//
// Two audiences and they want different things. A crawler wants one canonical
// address per page and a map of the same page in the other languages; Telegram
// wants a title, a line and a picture. The second is the one that decides
// whether a link posted in a group looks like anything, and this product moves
// through groups.
//
// Nothing here reads a request header. The origin is the configured one, for
// the same reason sign-in links use it: a canonical URL built from a Host
// header is a canonical URL whoever sent the request chose.

/** `getPathname` accepts more than a string; a page only ever passes one. */
type Href = Parameters<typeof getPathname>[0]["href"];

/** Open Graph writes a locale as language_TERRITORY. */
const OG_LOCALE: Record<Locale, string> = {
  uz: "uz_UZ",
  ru: "ru_RU",
  en: "en_US",
};

/**
 * A route segment, narrowed to a language this site is written in.
 *
 * The segment is whatever was typed, and metadata is built before the layout
 * gets to refuse it: `/xx/pricing` reaches here on its way to a 404, and
 * reading a catalogue that does not exist would throw before it got there.
 */
function resolve(requested: string): Locale {
  return hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
}

/** `uz` as Open Graph spells it. */
export function ogLocale(requested: string): string {
  return OG_LOCALE[resolve(requested)];
}

/** An absolute URL, which is the only kind Open Graph and hreflang accept. */
export function absolute(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The address of one page in one language, built the way a `<Link>` is. */
export function localeUrl(href: Href, locale: Locale): string {
  return absolute(getPathname({ href, locale }));
}

/**
 * The same page with no language in it.
 *
 * `proxy.ts` sends a bare path to whichever language the reader asked for, so
 * this is the address that targets nobody in particular — which is what
 * `x-default` means, and what a link printed or pasted without a locale is.
 *
 * Taken by removing the prefix `getPathname` added rather than by using the
 * href directly: an href is not always a path, and the prefixing rule lives in
 * `i18n/routing.ts` where it can be changed once.
 */
function bareUrl(href: Href): string {
  const path = getPathname({ href, locale: routing.defaultLocale });
  const bare = path.replace(
    new RegExp(`^/${routing.defaultLocale}(?=/|$)`),
    "",
  );
  return absolute(bare || "/");
}

/**
 * Every address this page has: one per language, plus the one that negotiates.
 *
 * The language is a path segment here — `/uz/pricing`, `/ru/pricing` — so the
 * three translations are three pages rather than one page that changes when
 * the reader does. That is only true to a crawler if each of them says so: a
 * canonical naming itself and an hreflang naming its siblings. Without the
 * pair, one page's standing is split three ways and the Russian version is
 * indexed as a duplicate of the Uzbek one, or not at all.
 */
export function languagesFor(href: Href): Record<string, string> {
  const languages: Record<string, string> = { "x-default": bareUrl(href) };
  for (const locale of routing.locales) {
    languages[locale] = localeUrl(href, locale);
  }
  return languages;
}

/**
 * The one line a page adds to its own `generateMetadata`.
 *
 * Returned as a block rather than as advice, so adding a page is spreading
 * this and nothing else — and the day a fourth language is added, no page has
 * to be edited.
 *
 * IT MUST NOT GROW AN `openGraph` KEY, however tempting `og:url` is. Metadata
 * is merged one field deep, and the picture drawn by `opengraph-image.tsx` is
 * attached to whichever segment last declared `openGraph` — so a page that
 * declares one, even with no `images` in it, is published with no share
 * picture at all. That was measured, not guessed: `/ru/pricing` lost its card
 * the moment this returned an Open Graph block, while `/uz`, which returned
 * none, kept it. The site's Open Graph defaults live in the layout, where one
 * declaration covers every page, and Next fills `og:title` and
 * `og:description` from each page's own title and description.
 */
export function pageSeo(
  href: Href,
  requested: string,
): Pick<Metadata, "alternates"> {
  const locale = resolve(requested);
  const languages = languagesFor(href);

  return { alternates: { canonical: languages[locale], languages } };
}
