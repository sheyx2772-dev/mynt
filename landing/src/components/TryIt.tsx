import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import Plate from "@/components/Plate";
import { qrPath } from "@/lib/qr";
import { SITE_HOST, profileUrl } from "@/lib/site";

// The demo, before anything is asked for.
//
// A visitor cannot be told what tapping a card is like; they can be shown in
// four seconds. The code opens a profile that really exists, on the real
// address a buyer's card would carry — not a screenshot and not a mock-up,
// because the whole doubt this section answers is whether the thing is real.
const SAMPLE = "NAV001";

export default async function TryIt() {
  const t = await getTranslations("try");

  const url = profileUrl(SAMPLE);
  const qr = qrPath(url);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="text-[28px] leading-8 font-semibold tracking-tight text-balance">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-[46ch] leading-6 text-ink-2">{t("lead")}</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Hidden on a phone, and not as a layout convenience: a reader
              holding the screen the code is on cannot scan it. Offering one
              anyway would be asking them to do something impossible, so that
              reader gets the note and the button below instead — the same
              profile, one tap, no camera. */}
          <div className="hidden rounded-card border border-line bg-white p-5 shadow-photo lg:block">
            <svg
              viewBox={`0 0 ${qr.size} ${qr.size}`}
              role="img"
              aria-label={t("qrLabel", { number: SAMPLE })}
              className="size-[200px] text-ink"
              shapeRendering="crispEdges"
            >
              <path d={qr.d} fill="currentColor" />
            </svg>
            <p className="mt-3 text-center font-mono text-[13px] text-ink-3">
              {SITE_HOST}/{SAMPLE}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Plate handle={SAMPLE} size="sm" />
            <span className="text-sm text-ink-3">{t("caption")}</span>
          </div>

          <div className="w-full lg:hidden">
            <p className="text-sm leading-5 text-ink-3">{t("phoneNote")}</p>
            {/* Not the `Link` from `@/i18n/navigation`: that one adds the
                reader's language to the path, and a profile has no language
                in its address — see `proxy.ts`. `/uz/NAV001` is a page that
                does not exist. */}
            <Link
              href={`/${SAMPLE}`}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-input bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-s2"
            >
              {t("open")}
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
