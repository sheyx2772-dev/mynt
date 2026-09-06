import { cookies, headers } from "next/headers";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

// Resolved once per request; every server component then uses
// `await getTranslations()` and never thinks about the language again.
//
// Two kinds of page ask, and they ask differently.
//
// The site's own pages carry the language in the path — `/uz/pricing` — so the
// segment answers and there is nothing to negotiate. A profile does not: it
// lives at `/VIP777` because that address is engraved on a card, and the person
// opening it has never been here, chose nothing and has no cookie. Its language
// is a property of the reader, so it is negotiated from what their browser
// asks for. A card that opens in a language its finder cannot read is a card
// that does not work.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  const locale = hasLocale(routing.locales, requested)
    ? requested
    : await negotiate();

  return {
    locale,
    // Per request rather than all three at once: a Russian reader has no use
    // for the Uzbek bundle, and the lot would grow with every language added.
    messages: (await import(`../../messages/${locale}.json`)).default,
    // Said explicitly. Left out, dates are formatted in whatever zone the
    // server happens to run in — which is how something written at 23:40 in
    // Tashkent gets yesterday's date on the receipt.
    timeZone: "Asia/Tashkent",
  };
});

/**
 * A stored choice first, then what the browser asked for.
 *
 * The header is read in order rather than scored by quality: the first language
 * we speak is the one they listed first, and `q` values are the browser's
 * opinion about languages we do not offer.
 */
async function negotiate() {
  const [jar, head] = await Promise.all([cookies(), headers()]);

  const stored = jar.get(routing.localeCookie ? "til" : "til")?.value;
  if (hasLocale(routing.locales, stored)) return stored;

  for (const part of head.get("accept-language")?.split(",") ?? []) {
    const tag = part.split(";")[0]?.trim().slice(0, 2).toLowerCase();
    if (hasLocale(routing.locales, tag)) return tag;
  }

  return routing.defaultLocale;
}
