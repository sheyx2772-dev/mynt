import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import ResidentAvatar from "@/components/ResidentAvatar";
import { Link } from "@/i18n/navigation";
import { directory } from "@/lib/backend/residents";

// Who has just joined.
//
// The strongest thing an entry page can show a stranger is that somebody else
// already bought this, with a face and a name on it. So these are real rows
// from the real table, and when there are none the strip does not render — a
// row of placeholder faces would be exactly the lie the counter beside it
// exists to avoid.

export default async function Residents() {
  const dir = await directory();
  if (!dir || dir.newest.length === 0) return null;

  const t = await getTranslations("residents");

  return (
    <section className="mx-auto max-w-6xl py-16 sm:py-20">
      <div className="flex items-baseline justify-between gap-4 px-6">
        <p className="cap text-ink-3">{t("eyebrow")}</p>

        <Link
          href="/residents"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
        >
          {t("seeAll")}
          <ArrowRight className="size-4" strokeWidth={2} />
        </Link>
      </div>

      {/* One rail on a phone, a grid from `sm` up. Wrapping four cards onto
          two rows on a 360px screen buries the fourth below the fold; a rail
          keeps them all one thumb away and says there are more. The padding
          lives on the list rather than the section so the first and last card
          can sit against the margin and still scroll clear of it. */}
      <ul className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {dir.newest.slice(0, 4).map((r) => (
          <li key={r.raqam} className="w-60 shrink-0 snap-start sm:w-auto">
            {/* Plain next/link, absolute path: a profile lives outside the
                locale prefix, and `src/proxy.ts` says why. */}
            <NextLink
              href={`/${r.raqam}`}
              className="flex items-center gap-3 rounded-card border border-line bg-white p-3 transition-colors hover:border-line-2"
            >
              <ResidentAvatar name={r.ism} photo={r.rasm} />

              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">
                  {r.ism}
                </span>
                <span className="block truncate font-mono text-[13px] text-ink-3">
                  arend.uz/{r.raqam}
                </span>
              </span>
            </NextLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
