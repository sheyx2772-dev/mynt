import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";

import { routing } from "./routing";

// Resolved once per request; every server component then uses
// `await getTranslations()` and never thinks about the language again.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  // A path segment is user input. `/xx/narxlar` must answer in the default
  // language rather than reach for `messages/xx.json` and throw.
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

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
