import { getTranslations } from "next-intl/server";
import { ArrowRight, Store, User } from "lucide-react";

import { Link } from "@/i18n/navigation";

// The fork, said out loud at the entrance.
//
// Both products were reachable on the old site and neither was announced: the
// personal side was simply what the page was about, and the business side was
// a link in the header and a card two thirds of the way down. Somebody who
// runs a cafe had to work out that this site was also for them.
//
// So the two are stated as two, side by side, before anything else is
// explained. The contrast is carried by the cards themselves — one on the
// accent, one on the ink — because a person deciding which of two things they
// are should see that there are two before reading a word.
export default async function TwoWays() {
  const t = await getTranslations("ways");

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-20">
      <p className="cap mb-4 text-ink-3">{t("eyebrow")}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* The second lime object, and the last. The first is the word
            highlighted in the headline; nothing between them wears it, which
            is what keeps two from reading as a pattern. */}
        <Link
          href="/personal"
          className="group flex flex-col rounded-tile bg-lime p-6 text-ink shadow-glow transition-transform hover:-translate-y-0.5 sm:p-8"
        >
          <User className="size-6 text-ink-2" strokeWidth={1.6} />
          <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("personal")}
          </h2>
          <p className="mt-3 flex-1 leading-relaxed text-ink-2">
            {t("personalDesc")}
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
            {t("personalCta")}
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </span>
        </Link>

        <Link
          href="/business"
          className="group relative flex flex-col overflow-hidden rounded-tile bg-ink p-6 text-white transition-transform hover:-translate-y-0.5 sm:p-8"
        >
          <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-lime/12 blur-[90px]" />

          <Store className="relative size-6 text-lime" strokeWidth={1.6} />
          <h2 className="relative mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("business")}
          </h2>
          <p className="relative mt-3 flex-1 leading-relaxed text-paper-2">
            {t("businessDesc")}
          </p>
          <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-medium text-lime">
            {t("businessCta")}
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </span>
        </Link>
      </div>
    </section>
  );
}
