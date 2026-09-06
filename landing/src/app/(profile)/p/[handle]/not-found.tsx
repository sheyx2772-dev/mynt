import Link from "next/link";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import Mark from "@/components/Mark";

/**
 * A number nobody holds. Which, on this site, is a thing for sale.
 *
 * The response carries a real 404 and a `noindex`, but the markup arrives in
 * the RSC payload rather than in the first HTML: this app has two root layouts
 * and no `app/layout.tsx`, so Next has no single `<html>` to build an error
 * shell from and sends its own, leaving React to swap this in. Measured, not
 * assumed — the same thing happens without the proxy's rewrite in front of it.
 * The fix, if it ever matters, is a root layout the two branches share, which
 * is a larger change than a 404 page justifies.
 *
 * `not-found.tsx` cannot read route params, so the proxy that rewrote the
 * request puts the number in a header for it. That header is not user input
 * dressed up as trust: the proxy sets it on every profile request from its own
 * regex match, so anything a caller sent under the same name is overwritten
 * before this file runs. It is checked again here anyway — a header is cheap to
 * re-validate and this string is printed on the page.
 */
const HANDLE = /^[A-Z]{3}[0-9]{3}$/;

export default async function ProfileNotFound() {
  const [head, locale, t] = await Promise.all([
    headers(),
    getLocale(),
    getTranslations("profile"),
  ]);

  const asked = head.get("x-flex-handle") ?? "";
  const handle = HANDLE.test(asked) ? asked : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <Mark tone="dark" className="size-11" />

      {handle && (
        <p className="mt-7 rounded-plate bg-[var(--p-surface)] px-3.5 py-1.5 font-mono text-sm font-semibold tracking-[0.22em] text-[var(--p-accent)]">
          {handle}
        </p>
      )}

      <h1 className="mt-4 text-2xl leading-7 font-semibold text-balance">
        {handle ? t("freeTitle", { handle }) : t("freeTitleUnknown")}
      </h1>

      <p className="mt-3 text-[15px] leading-6 text-pretty text-[var(--p-text-2)]">
        {t("freeBody")}
      </p>

      {/* The locale is written into the href. This page has no locale segment
          to read one from — it answers on `/VIP777`, the address engraved on a
          card — so next-intl's own Link would have nothing to go on. */}
      <Link
        href={handle ? `/${locale}/personal?number=${handle}` : `/${locale}`}
        className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-input bg-[var(--p-accent)] px-5 font-semibold text-[var(--p-on-accent)]"
      >
        {t("freeCta")}
        <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
      </Link>

      <Link
        href={`/${locale}`}
        className="mt-4 text-[14px] text-[var(--p-text-3)] underline-offset-4 hover:underline"
      >
        {t("freeBrowse")}
      </Link>
    </main>
  );
}
