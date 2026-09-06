import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";

// Where the tag goes.
//
// Photographs here, not drawings, and that is not a contradiction of the
// devices shelf. A card is one object and a drawing of it is exact; a cafe is
// a room, and the thing being sold is a stand on a table in it — which a
// visitor recognises from a photograph in a second and from a line drawing not
// at all.
//
// Six rather than four. Four covered the trades we had photographs of and left
// out the shop and the everything-else, which is where most of the questions
// actually come from — a bus company, a museum, a car park. A visitor whose
// own trade is missing from a list of four reads the list as "not for me".
//
// Each is cropped to 3:4 at whatever the source actually holds, and that is
// the whole reason they are sharp. They were landscape before, poured into a
// portrait tile: `sizes` describes the box's WIDTH, so Next served a 640-wide
// file, `object-cover` kept the middle third of it, and a 250-pixel-wide sliver
// was stretched across the tile. The picture was never the problem — the crop
// was being done by the browser, after the file had been chosen. It happens at
// build time now, and none of these is upscaled by a pixel.
const TILES = [
  { photo: "kafe", href: "/business#cafes" },
  { photo: "mehmonxona", href: "/business#hotels" },
  { photo: "salon", href: "/business#salons" },
  { photo: "klinika", href: "/business#clinics" },
  // The last two land on the enquiry rather than a section, because there is
  // no shop section and no everything-else section to land on — and a link
  // that jumps to an anchor which does not exist silently drops the reader at
  // the top of the page, looking at cafes. The form's own list covers both.
  { photo: "dokon", href: "/business#enquiry" },
  { photo: "boshqa", href: "/business#enquiry" },
] as const;

export default async function Verticals() {
  const t = await getTranslations("verticals");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <p className="cap text-ink-3">{t("eyebrow")}</p>
      <p className="mt-2 max-w-xl text-ink-2">{t("note")}</p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {TILES.map((tile, i) => (
          <li key={tile.photo}>
            <Link
              href={tile.href}
              className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-card"
            >
              <Image
                src={`/mahsulot/${tile.photo}.webp`}
                alt=""
                fill
                // Wider than the box on purpose. The tile is 358 CSS pixels,
                // but this screen is at 1.33 device pixels per CSS pixel and a
                // phone is at 3, and the browser picks the candidate nearest
                // the number it is given — so a truthful 358 fetches a file
                // that has to be stretched by a third before it is drawn. This
                // buys the next size up, which is a few kilobytes against a
                // tile that is actually in focus.
                sizes="(min-width: 1024px) 480px, (min-width: 640px) 50vw, 100vw"
                // 75 is the default and it is tuned for a photograph shown
                // large. Here the encoder has few pixels to spend and every
                // artefact lands on a face; the file is a few kilobytes bigger
                // and the tile stops looking hazy. `next.config.ts` has to list
                // this number or the request comes back 400 with no picture.
                quality={90}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
              />

              {/* Dark at the foot, clear at the head. A flat scrim over the
                  whole picture would dim the thing the picture is there to
                  show; the text only needs the bottom third.

                  It used to reach 55% at the midpoint, which is halfway up the
                  photograph — enough to grey the whole tile and read as a soft
                  picture rather than a deliberate one. */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-45% via-ink/45 to-70% to-transparent" />

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
