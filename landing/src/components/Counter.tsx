import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Plate from "@/components/Plate";
import { directory } from "@/lib/backend/residents";

// How much of the namespace is gone, counted rather than claimed.
//
// This is the section that replaces a badge reading "BU HAFTA — 2 481 tashrif"
// on the site before this one: a figure typed into the markup and connected to
// nothing. A made-up number says nothing, and it was also the weaker move —
// one that moves because people are buying does the same job honestly and does
// it better. Which is why it renders nothing at all when it cannot read the
// real one, and why nothing here has a fallback value.
const PLATES = 5;

export default async function Counter() {
  const dir = await directory();

  // Two silences, one reason. No answer means we do not know; zero taken means
  // an empty shop, and an empty shop is not proof of anything.
  if (!dir || dir.band === 0) return null;

  const t = await getTranslations("counter");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <p className="cap text-ink-3">{t("eyebrow")}</p>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-lg text-ink-2">
        {t.rich("taken", {
          count: dir.band,
          // The numeral is the whole point of the line, so it is set at
          // headline size inside the sentence rather than stacked above it —
          // "5 raqam berildi" is a sentence, and a person reads it as one.
          n: (chunks) => (
            <span className="font-mono text-5xl leading-none font-semibold tracking-tight text-ink tabular-nums sm:text-6xl">
              {chunks}
            </span>
          ),
        })}
      </p>

      <p className="mt-3 text-sm text-ink-3">
        {t("left", { count: dir.jami - dir.band })}
      </p>

      {dir.newest.length > 0 && (
        <div className="mt-10">
          <p className="cap text-ink-3">{t("latest")}</p>

          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
            {dir.newest.slice(0, PLATES).map((r) => (
              <li key={r.raqam}>
                {/* Plain next/link, absolute path. A profile lives outside the
                    locale prefix — `arend.uz/VIP777` is what is engraved on
                    the plastic, and `src/proxy.ts` lets that shape through the
                    locale middleware untouched. The locale-aware Link would
                    send it to /uz/VIP777, an address no card carries. */}
                <Link
                  href={`/${r.raqam}`}
                  title={r.ism}
                  className="inline-block rounded-plate transition-opacity hover:opacity-80"
                >
                  <Plate handle={r.raqam} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
