import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";

// Where the tag goes.
//
// Photographs here, not drawings, and that is not a contradiction of the
// devices shelf. A card is one object and a drawing of it is exact; a cafe is
// a room, and the thing being sold is a stand on a table in it — which a
// visitor recognises from a photograph in a second and from a line drawing
// not at all.
//
// Each is cropped to 3:4 at whatever the source actually holds, and that is
// the whole reason they are sharp. They were landscape before, poured into a
// portrait tile: `sizes` describes the box's WIDTH, so Next served a 640-wide
// file, `object-cover` kept the middle third of it, and a 250-pixel-wide sliver
// was stretched across a 528-pixel-wide tile. The picture was never the problem
// — the crop was being done by the browser, after the file had been chosen.
//
// So the crop happens at build time now, and none of these is upscaled by a
// pixel: 576 wide is the smallest of them, against the 528 a two-times screen
// asks for.
const TILES = [
  { photo: "/mahsulot/kafe.webp", href: "/business" },
  { photo: "/mahsulot/mehmonxona.webp", href: "/business#hotels" },
  { photo: "/mahsulot/salon.webp", href: "/business#salons" },
  { photo: "/mahsulot/klinika.webp", href: "/business#clinics" },
] as const;

export default async function Verticals() {
  const t = await getTranslations("verticals");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <p className="cap text-ink-3">{t("eyebrow")}</p>
      <p className="mt-2 max-w-xl text-ink-2">{t("note")}</p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {TILES.map((tile, i) => (
          <li key={tile.photo}>
            <Link
              href={tile.href}
              className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-card"
            >
              <Image
                src={tile.photo}
                alt=""
                fill
                sizes="(min-width: 1024px) 276px, (min-width: 640px) 50vw, 100vw"
                // 75 is the default and it is tuned for a photograph shown
                // large. These are 276 wide, where the encoder has few pixels
                // to spend and every artefact lands on a face; the file is a
                // few kilobytes bigger and the tile stops looking hazy.
                quality={90}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
              />

              {/* Dark at the foot, clear at the head. A flat scrim over the
                  whole picture would dim the thing the picture is there to
                  show; the text only needs the bottom third.

                  It used to reach 55% at the midpoint, which is halfway up the
                  photograph — enough to grey the whole tile and read as a soft
                  picture rather than a deliberate one. The stops are pushed
                  down instead: clear to just under half, then it falls. */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 via-45% to-transparent to-70%" />

              <div className="relative p-4 text-white">
                <h3 className="font-semibold">{t(`name${i + 1}`)}</h3>
                <p className="mt-1 text-[13px] leading-snug text-paper-2">
                  {t(`note${i + 1}`)}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-lime">
                  {t("open")}
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
