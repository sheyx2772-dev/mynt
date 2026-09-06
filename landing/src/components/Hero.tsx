import { getTranslations } from "next-intl/server";

import FlexCard from "@/components/FlexCard";
import HandleForm from "@/components/HandleForm";

// The first screen.
//
// Two claims and one thing to do. The claim is that this is a business card
// you tap; the thing to do is find out whether the number you already have in
// mind is free — which is the one action that works before a visitor has
// decided which of the two products they are here for.
//
// Nothing on it runs in the browser. The badge, the heading, the form and the
// card are all rendered on the server, so the page is usable the moment it
// arrives rather than the moment a bundle does.
export default async function Hero() {
  const t = await getTranslations("hero");

  return (
    <section className="mx-auto max-w-6xl px-6 pt-12 pb-14 sm:pt-16">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-14">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-ink/[0.03] px-3 py-1.5">
            {/* A dot, not a badge full of colour. It is the only thing on the
                page that moves, and it moves because the claim is about a
                signal. */}
            <span className="size-1.5 animate-pulse rounded-full bg-lime-ink" />
            <span className="cap text-ink-2">{t("badge")}</span>
          </p>

          <h1 className="max-w-2xl text-[2.2rem] leading-[1.06] font-semibold tracking-tight text-balance sm:text-5xl">
            {t("titleA")}{" "}
            <span className="rounded-plate bg-lime px-2 text-ink">
              {t("titleMark")}
            </span>{" "}
            {t("titleB")}
          </h1>

          <div className="mt-7">
            <HandleForm />
          </div>
        </div>

        {/* Container queries, so the engraving scales with the card rather
            than with the window: at 22rem in a column and full width on a
            phone it is the same object, not two sizes of type. */}
        <div className="mx-auto mt-12 w-full max-w-[20rem] [container-type:inline-size] lg:mt-0 lg:max-w-none">
          <FlexCard />
        </div>
      </div>
    </section>
  );
}
