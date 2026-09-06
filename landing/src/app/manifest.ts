import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";

// The installable app.
//
// One file for a trilingual site, and it cannot be otherwise: a manifest is
// fetched with credentials omitted, so the `til` cookie never reaches it and a
// per-language manifest would silently always be Uzbek anyway. So it says the
// least it can — the name, which is the same in every language, and the line
// under it in the language the product is written in. Strings come from the
// Uzbek catalogue rather than being typed here, so a change to the tagline is
// one edit rather than two.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: "site",
  });
  const nav = await getTranslations({
    locale: routing.defaultLocale,
    namespace: "nav",
  });

  return {
    // Stable identity. Without it a browser derives one from `start_url`, and
    // changing that later installs a second, unrelated app beside the one
    // people already have.
    id: "/",
    lang: routing.defaultLocale,
    dir: "ltr",
    name: t("name"),
    short_name: t("name"),
    description: t("tagline"),
    // The bare root rather than `/uz`. It is the one address in this site that
    // has no language in it: `proxy.ts` sends it to the reader's own, which is
    // the only way a manifest that cannot be translated opens in the right
    // language.
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // The two brand grounds, from `globals.css`: `--color-paper` behind the
    // page while it loads, `--color-ink` on the system bar. A splash screen in
    // a colour the site never uses is the tell that a manifest was written
    // from a template.
    background_color: "#fafaf8",
    theme_color: "#0e0a1b",
    // Drawn by `scripts/make-icons.mjs` from the same geometry the header
    // draws in SVG. `npm run icons` after changing the mark.
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Bleeds to the edges so a launcher can crop it to any shape.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Long-pressing the installed icon jumps straight to a page.
    //
    // Both of these have to work for somebody who owns no number and for
    // somebody who owns six, which rules out anything under `/cabinet`: that
    // is another application behind a session, and a shortcut into it is a
    // shortcut to a sign-in form. These two are the same address for everyone.
    shortcuts: [
      { name: nav("personal"), short_name: nav("personal"), url: "/personal" },
      { name: nav("pricing"), short_name: nav("pricing"), url: "/pricing" },
    ],
  };
}
