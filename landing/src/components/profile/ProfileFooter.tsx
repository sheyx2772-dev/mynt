import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Eye } from "lucide-react";

import Mark from "@/components/Mark";

// The bottom of the card, and the cheapest customer this product will ever get.
//
// Most people meet Flex by tapping a stranger's. The question they arrive with
// is "can I have one?", so it is answered here, once, after the profile they
// came for rather than over it.
//
// Not on premium. "The Flex mark comes off the page" is something an owner
// paid for, and leaving a small label while adding a larger block would be
// keeping the letter of that and breaking the rest.

export default async function ProfileFooter({
  handle,
  views,
  locale,
  showPitch,
}: {
  handle: string;
  views: number;
  locale: string;
  showPitch: boolean;
}) {
  const t = await getTranslations("profile");

  return (
    <footer className="mt-2 flex flex-col gap-7">
      {views > 0 && (
        <p className="flex items-center justify-center gap-1.5 text-[13px] text-[var(--p-text-3)]">
          <Eye aria-hidden className="size-3.5" strokeWidth={1.75} />
          <span className="tabular-nums">{t("views", { count: views })}</span>
        </p>
      )}

      {showPitch && (
        <section className="rounded-tile bg-[var(--p-surface)] px-5 py-6 text-center">
          <p className="text-[17px] leading-6 font-semibold text-balance text-[var(--p-text)]">
            {t("ownTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[14px] leading-5 text-pretty text-[var(--p-text-2)]">
            {t("ownBody")}
          </p>
          {/* Plain next/link with the locale written in. next-intl's own Link
              reads the language off a segment this page does not have — the
              address is `/VIP777`, because that is what is engraved. */}
          <Link
            href={`/${locale}`}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-input bg-[var(--p-accent)] px-5 text-sm font-semibold text-[var(--p-on-accent)]"
          >
            {t("ownCta")}
            <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
          </Link>
        </section>
      )}

      <div className="flex items-center justify-center gap-2.5 text-[13px] text-[var(--p-text-3)]">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <Mark tone="dark" className="size-6" />
          <span className="sr-only">{t("home")}</span>
          <span className="font-semibold tracking-wide text-[var(--p-text-2)]">
            FLEX
          </span>
        </Link>
        <span aria-hidden>·</span>
        <span className="font-mono tracking-[0.14em] tabular-nums">
          {handle}
        </span>
      </div>
    </footer>
  );
}
