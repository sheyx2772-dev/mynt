import type { Metadata } from "next";

import { SITE_URL } from "./site-url";
import type { Lang } from "./i18n";

// What every page tells a crawler and a chat client, in one place.
//
// Two audiences, and they are not the same one. A crawler wants a canonical
// address, a language, and a machine-readable claim about what the page is.
// Telegram and WhatsApp want a title, a line of text and a picture — and this
// product is shared by one person handing another a link, so the second
// audience is the one that decides whether the link looks like anything.
//
// Nothing here reads a request header. The origin is the configured one, for
// the same reason sign-in links use it: a canonical URL taken from a Host
// header is a canonical URL an attacker can set.

export const SITE_NAME = "Flex";

/** The share card a page falls back to. Drawn by landing/scripts/make-icons.mjs. */
const DEFAULT_IMAGE = "/og.png";

/** An absolute URL, which is the only kind Open Graph accepts. */
export function absolute(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const LANGS: Lang[] = ["uz", "ru", "en"];

/** Open Graph writes a locale as language_TERRITORY. */
const LOCALE: Record<Lang, string> = {
  uz: "uz_UZ",
  ru: "ru_RU",
  en: "en_US",
};

/**
 * The canonical address of a page, and the same page in the other languages.
 *
 * The language lives in a query parameter rather than a path prefix — handles
 * own the root, so `/ru/...` and `/{handle}` would be two dynamic segments at
 * the same level, which Next refuses. That makes the canonical form matter
 * more, not less: without it `/`, `/?til=ru` and `/?til=en` are three URLs
 * serving one page, and a crawler splits the page's standing three ways.
 *
 * x-default points at the bare address, which is the one that negotiates.
 */
export function alternates(path: string, lang: Lang): Metadata["alternates"] {
  const base = absolute(path);
  const languages: Record<string, string> = { "x-default": base };
  for (const l of LANGS) {
    languages[l] = l === "uz" ? base : `${base}${base.includes("?") ? "&" : "?"}til=${l}`;
  }

  return {
    // The canonical is the address in the language being served, so the three
    // translations stay three pages rather than collapsing into one.
    canonical: languages[lang],
    languages,
  };
}

/**
 * The block every page shares: what to call the site, which language this is,
 * and the picture to use when there is nothing more specific.
 */
export function social({
  title,
  description,
  path,
  lang,
  image,
  imageAlt,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  lang: Lang;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
}): Pick<Metadata, "openGraph" | "twitter" | "alternates"> {
  // The site card is a known 1200×630 and says so, which is what lets a chat
  // client reserve the space before the image arrives. An avatar is whatever
  // the owner uploaded, so its dimensions are left unstated rather than
  // guessed — a wrong width is worse than none, it crops the face.
  const picture = absolute(image ?? DEFAULT_IMAGE);
  const shaped = image
    ? { url: picture, alt: imageAlt ?? title }
    : { url: picture, width: 1200, height: 630, alt: imageAlt ?? title };

  return {
    alternates: alternates(path, lang),
    openGraph: {
      type,
      siteName: SITE_NAME,
      title,
      description,
      url: absolute(path),
      locale: LOCALE[lang],
      alternateLocale: LANGS.filter((l) => l !== lang).map((l) => LOCALE[l]),
      images: [shaped],
    },
    twitter: {
      // The large card is the one that shows the picture at a size worth
      // having; the summary card crops it to a thumbnail.
      card: "summary_large_image",
      title,
      description,
      images: [picture],
    },
  };
}
