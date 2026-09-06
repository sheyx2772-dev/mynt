import { getTranslations } from "next-intl/server";

import { lines } from "./lines";

// What happens when the paying stops.
//
// The honest half of a subscription page, and the reason this section is on
// the ink ground instead of buried in the terms: the answer is that the
// profile keeps opening and only editing closes, which is the difference
// between a subscription and a hostage. Somebody deciding whether to put their
// number on a printed card is asking this silently, and a page that will not
// answer it is answered for — with the worst assumption.
export default async function Lapsed() {
  const t = await getTranslations("pricingPage");
  const items = lines(t.raw("lapsedItems"));

  return (
    <section className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <h2 className="text-[28px] leading-8 font-semibold tracking-tight">
          {t("lapsedTitle")}
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-paper-2">
          {t("lapsedBody")}
        </p>

        <ul className="mt-8 grid max-w-4xl gap-x-8 gap-y-5 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item}
              className="border-t border-ink-line pt-4 leading-relaxed text-paper-2"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
