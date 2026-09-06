import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";

// What the number is carried on.
//
// A shelf, not the carousel the old site rotated through twenty-nine objects
// of. A carousel says "we have twenty-nine"; a shelf says "you want this one".
// Somebody deciding whether to buy is choosing between four things, and the
// catalogue is a page of its own for the person who wants it.
//
// Photographs, after a detour through drawings. The drawings were sharp and
// they were also four grey outlines on a white page — the objects are the
// product, and a line drawing of a ring sells nothing.
//
// All four are the same shot: the object cut out, one lime line on it, centred
// on the same near-white ground at 900x900. That sameness is the whole point of
// a shelf — four photographs taken four ways read as four suppliers. The fourth
// tile was a sticker for a while and broke it: the only sticker photograph in
// the archive was 316x186 of a windscreen at dusk, and blown up to a square it
// was a dark blur with unreadable text on it. The car tag replaced it because a
// photograph of it exists in the family, and a product we can show beats a
// product we can only name.
const SHELF = [
  { photo: "/mahsulot/karta.webp", href: "/devices/karta" },
  { photo: "/mahsulot/uzuk.webp", href: "/devices/uzuk" },
  { photo: "/mahsulot/braslet.webp", href: "/devices/braslet" },
  { photo: "/mahsulot/avto.webp", href: "/devices/avto" },
] as const;

export default async function Devices() {
  const t = await getTranslations("devices");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <p className="cap text-ink-3">{t("eyebrow")}</p>
      <p className="mt-2 max-w-xl text-ink-2">{t("note")}</p>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {SHELF.map((item, i) => (
          <li key={item.photo}>
            <Link
              href={item.href}
              className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white transition-colors hover:border-line-lead"
            >
              <div className="relative aspect-square overflow-hidden bg-paper">
                <Image
                  src={item.photo}
                  alt={t(`name${i + 1}`)}
                  fill
                  sizes="(min-width: 1024px) 276px, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              </div>

              <div className="flex items-baseline justify-between gap-2 p-4">
                <span className="font-semibold">{t(`name${i + 1}`)}</span>
                <span className="font-mono text-[13px] tracking-[0.06em] text-ink-3">
                  {t(`price${i + 1}`)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/devices"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
      >
        {t("seeAll")}
        <ArrowRight className="size-4" strokeWidth={2} />
      </Link>
    </section>
  );
}
