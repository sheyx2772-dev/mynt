import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { SITE_HOST } from "@/lib/site";

// The picture a link shows when somebody pastes it into Telegram.
//
// This is not decoration. Nobody in this market has heard of the product yet,
// and it spreads by one person sending another a link — so the preview is the
// first thing about Flex that most people will ever see, and a link with no
// picture reads as a link nobody should open.
//
// Drawn here rather than exported from a design tool, because a PNG in
// `public/` is a picture of the site as it looked the day somebody remembered
// to re-export it. This one is built from the same colours and the same words
// as the page: change the tagline and the card changes with it.
//
// Inherited by every page under `(site)/[locale]` that does not draw its own,
// which is all of them but the device pages.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * The one string here that is not translated, and cannot be.
 *
 * Next reads `alt` at module scope, before there is a request or a language,
 * and the localised alternative — `generateImageMetadata` — is executed in the
 * same context as `generateStaticParams`, where reading a header is an error
 * and `next-intl` reads one to work out the language. So this is Uzbek, as the
 * product is. It describes the picture rather than the page, so it does not go
 * stale when the copy above does.
 */
export const alt = "Flex — raqamli vizitka";

// The brand ink and lime, from `globals.css`. Stated rather than imported: a
// CSS custom property is resolved by a browser, and there is no browser here.
const INK = "#0e0a1b";
const LIME = "#abff09";
const PAPER_2 = "#b3afc2";

// The mark, already drawn. The maskable icon is a full-bleed ink square with
// the lime glyph on it, so laid on this card's ink ground it reads as the
// glyph alone — no second file to keep in step.
const markPromise = readFile(
  join(process.cwd(), "public", "icon-maskable-512.png"),
).then((file) => `data:image/png;base64,${file.toString("base64")}`);

export default async function Image({ params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  const [t, seo, hero, mark] = await Promise.all([
    getTranslations({ locale, namespace: "site" }),
    getTranslations({ locale, namespace: "seo" }),
    getTranslations({ locale, namespace: "hero" }),
    markPromise,
  ]);

  // The card has its own two lines, because what makes somebody open a link in
  // a group chat is not what makes them read further once the page is open.
  //
  // The fallbacks are temporary: `seo` is being written into the catalogues as
  // this is added, and a share card that says `seo.ogTitle` for the hour in
  // between would be cached by Telegram for far longer than that hour. Delete
  // the `has` checks once the three files carry the namespace.
  const title = seo.has("ogTitle") ? seo("ogTitle") : t("tagline");
  const lead = seo.has("ogLead") ? seo("ogLead") : hero("badge");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: INK,
        // The lime, as the light coming off the edge of a card rather than
        // as a block of colour. A gradient rather than a circle behind the
        // type: there is no blur here — the renderer draws shapes and text —
        // and a translucent disc on ink has a visible edge, which reads as a
        // mistake at the size a chat client shows this.
        backgroundImage:
          "radial-gradient(760px 620px at 88% -12%, rgba(171, 255, 9, 0.20), rgba(14, 10, 27, 0) 62%)",
        color: "#ffffff",
        padding: 72,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <img src={mark} width={84} height={84} alt="" />
        <div style={{ fontSize: 46, letterSpacing: -1 }}>{t("name")}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 76, letterSpacing: -2, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ fontSize: 34, color: PAPER_2 }}>{lead}</div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* An example number, because the number is the product. It is a
              plate rather than text for the same reason it is one on the site:
              somebody has to recognise the thing they will be handed. */}
        <div
          style={{
            display: "flex",
            padding: "14px 28px",
            borderRadius: 16,
            background: LIME,
            color: INK,
            fontSize: 40,
            letterSpacing: 6,
          }}
        >
          AAA777
        </div>
        <div style={{ fontSize: 30, color: PAPER_2 }}>{SITE_HOST}</div>
      </div>
    </div>,
    size,
  );
}
