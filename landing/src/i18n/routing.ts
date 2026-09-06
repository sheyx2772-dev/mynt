import { defineRouting } from "next-intl/routing";

// The language is in the address.
//
// `/uz/narxlar`, `/ru/narxlar`, `/en/narxlar` — three pages, three addresses,
// three things a search engine can index and a person can send to somebody.
// A cookie cannot be linked to, and a page that changes language depending on
// who opens it is a page that cannot be shared.
//
// `always`, so the default is written out too. `/narxlar` and `/uz/narxlar`
// being the same page is two addresses for one thing, which is the problem
// hreflang exists to clean up after; better not to make it. The proxy sends a
// bare path to the reader's own language, so nothing that was printed or
// already linked stops working — it arrives one redirect later.
export const routing = defineRouting({
  locales: ["uz", "ru", "en"],
  defaultLocale: "uz",
  localePrefix: "always",

  // Remembered across visits, and only ever written when somebody chooses.
  // Detection from `Accept-Language` decides the first visit; after that the
  // choice wins, because a browser's header does not change when a person
  // switches language on a site.
  localeCookie: { name: "til", maxAge: 60 * 60 * 24 * 365 },
});

export type Locale = (typeof routing.locales)[number];
