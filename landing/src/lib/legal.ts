import type { ReactNode } from "react";

/**
 * One numbered part of a legal page.
 *
 * `id` is the anchor, so it is English and stable: a clause somebody linked to
 * from a support message has to still be there after the page is translated,
 * and an id built from a translated heading is a different id in every
 * language. `extra` is where a table of details sits inside the clause that
 * introduces it, rather than after all of them.
 */
export type LegalSection = {
  id: string;
  title: string;
  body: string[];
  extra?: ReactNode;
};

/**
 * When these documents last changed, as the calendar date they changed on.
 *
 * A contract that does not say when it was written cannot be told apart from
 * the one it replaced, and a buyer who agreed to the old one has no way to see
 * that anything moved. Set this by hand when a clause changes — a build date
 * would move every deploy and mean nothing.
 */
export const LEGAL_UPDATED = "2026-09-06";

/** The date, written the way the reader's language writes dates. */
export function legalDate(locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(LEGAL_UPDATED));
}
