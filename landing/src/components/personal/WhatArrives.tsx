import Image from "next/image";
import { getTranslations } from "next-intl/server";

const ITEMS = [1, 2, 3, 4] as const;

// What lands on the table.
//
// Between the price and the questions, because that is where "what do I
// actually get for this" is asked. Four things, and one of them is not an
// object at all: the address. A buyer who thinks they are buying a piece of
// plastic will not understand why it costs what it costs, and will not think
// to send the link in a message — which is the half of the product that works
// without the card being in the room.
export default async function WhatArrives() {
  const t = await getTranslations("personal");

  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="lg:grid lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="cap text-ink-3">{t("arrivesEyebrow")}</p>
            <h2 className="mt-2 text-[28px] leading-8 font-semibold tracking-tight">
              {t("arrivesTitle")}
            </h2>
            <p className="mt-3 max-w-md leading-relaxed text-ink-2">
              {t("arrivesLead")}
            </p>

            {/* 1600x900 on file, and this box is at most 544 wide — so a 2×
                screen asks for 1088 and never enlarges it. */}
            <div className="relative mt-8 hidden aspect-[16/9] overflow-hidden rounded-tile bg-fill shadow-photo lg:block">
              <Image
                src="/mahsulot/oila.webp"
                alt={t("arrivesPhotoAlt")}
                fill
                sizes="544px"
                className="object-cover"
              />
            </div>
          </div>

          <dl className="mt-10 divide-y divide-line-soft border-y border-line-soft lg:mt-0">
            {ITEMS.map((n) => (
              <div key={n} className="py-5">
                <dt className="font-semibold">{t(`arrive${n}Title`)}</dt>
                <dd className="mt-1.5 leading-relaxed text-ink-2">
                  {t(`arrive${n}Body`)}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-8 text-[15px] text-ink-3">{t("delivery")}</p>
      </div>
    </section>
  );
}
