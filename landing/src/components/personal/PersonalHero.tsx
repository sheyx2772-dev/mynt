import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

// What is being bought, said before anything is priced.
//
// The one sentence this page exists to land is that the number is bought, not
// rented: the old page opened on "you buy a unique handle" and then spent two
// screens on a monthly plan, and a visitor who read both came away thinking
// the number itself was the subscription. So the claim is the heading, the
// lime falls on the word that carries it, and the monthly part is not
// mentioned until the price section says what it is for.
export default async function PersonalHero() {
  const t = await getTranslations("personal");

  return (
    <section className="mx-auto max-w-6xl px-6 pt-12 pb-14 sm:pt-16">
      <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-14">
        <div>
          <p className="cap text-ink-3">{t("eyebrow")}</p>

          <h1 className="mt-3 max-w-2xl text-[2.2rem] leading-[1.06] font-semibold tracking-tight text-balance sm:text-5xl">
            {t("titleA")}{" "}
            <span className="rounded-plate bg-lime px-2 text-ink">
              {t("titleMark")}
            </span>
          </h1>

          <p className="mt-6 max-w-xl leading-relaxed text-ink-2">
            {t("lead")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#number"
              className="flex h-12 items-center justify-center gap-2 rounded-input bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-ink-s2"
            >
              {t("ctaPick")}
              <ArrowRight className="size-4" strokeWidth={2} />
            </a>
            <a
              href="#price"
              className="flex h-12 items-center justify-center rounded-input border border-line-2 px-6 text-sm font-semibold text-ink transition-colors hover:border-line-lead"
            >
              {t("ctaPrice")}
            </a>
          </div>
        </div>

        {/* 1600x900 on file. At the widest this column is drawn — half of a
            1152 container — a 2× screen asks for 1088, so the photograph is
            never enlarged past its own resolution. */}
        <div className="mt-12 lg:mt-0">
          <div className="relative aspect-[16/9] overflow-hidden rounded-tile bg-fill shadow-photo">
            <Image
              src="/mahsulot/tegizish.webp"
              alt={t("heroPhotoAlt")}
              fill
              priority
              sizes="(min-width: 1024px) 544px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
