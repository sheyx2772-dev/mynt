import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { DEVICES, deviceBySlug, money } from "@/lib/devices";
import { SITE_HOST } from "@/lib/site";

// A device's own share card.
//
// The site card is inherited by every other page and says what Flex is. That
// is the wrong answer here: somebody sends a link to the ring because they
// want the other person to see the ring, and six product pages previewing as
// one page is six links that look like the same link.
//
// It is also the page a price question is settled on, so the price is on the
// card. A preview that answers "how much" before the page is opened is the
// reason a link gets forwarded rather than opened once and dropped.
//
// WITHOUT THE PHOTOGRAPH, and that is not an oversight. The cut-outs under
// `public/mahsulot` are WebP, which is right for the pages — they are a third
// the size of the PNGs — and cannot be drawn here: this renderer decodes PNG,
// JPEG and SVG, and hands back "u2 is not iterable" for anything else. Getting
// the object onto the card means either a second PNG copy of every render in
// the repository or an image library added to the dependencies to decode one
// format into another at build time. Both are decisions about assets and
// dependencies rather than about metadata, so the card is typographic until
// somebody makes one of them on purpose.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Uzbek, and unavoidably so: see the note on `alt` in the site's own card. */
export const alt = "Flex NFC qurilmasi";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    DEVICES.map((device) => ({ locale, slug: device.slug })),
  );
}

const INK = "#0e0a1b";
const LIME = "#abff09";
const PAPER_2 = "#b3afc2";

const markPromise = readFile(
  join(process.cwd(), "public", "icon-maskable-512.png"),
).then((file) => `data:image/png;base64,${file.toString("base64")}`);

export default async function Image({
  params,
}: PageProps<"/[locale]/devices/[slug]">) {
  const { locale, slug } = await params;
  const device = deviceBySlug(slug);
  // The page refuses an unknown slug, but this is a route of its own: it is
  // fetched by whatever renders a preview, not through the page.
  if (!device) return new Response("Not found", { status: 404 });

  const [t, mark] = await Promise.all([
    getTranslations({ locale, namespace: "devices" }),
    markPromise,
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: INK,
        backgroundImage:
          "radial-gradient(760px 620px at 88% -12%, rgba(171, 255, 9, 0.20), rgba(14, 10, 27, 0) 62%)",
        color: "#ffffff",
        padding: 72,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <img src={mark} width={64} height={64} alt="" />
        <div style={{ fontSize: 30, color: PAPER_2, letterSpacing: 4 }}>
          {SITE_HOST.toUpperCase()}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 82, letterSpacing: -2, lineHeight: 1.05 }}>
          {t(`items.${slug}.name`)}
        </div>
        <div style={{ fontSize: 34, color: PAPER_2, lineHeight: 1.3 }}>
          {t(`items.${slug}.tagline`)}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          // The plate is as wide as the price. A column stretches its
          // children by default, and a lime bar across the whole card is a
          // banner rather than a price.
          alignSelf: "flex-start",
          padding: "14px 28px",
          borderRadius: 16,
          backgroundColor: LIME,
          color: INK,
          fontSize: 40,
        }}
      >
        {money(device.price)} {t("soum")}
      </div>
    </div>,
    size,
  );
}
