import type { Metadata } from "next";
import NextLink from "next/link";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { Eye, MapPin } from "lucide-react";

import ResidentAvatar from "@/components/ResidentAvatar";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { catalogue } from "@/lib/backend/residents-page";

// Prerendered in all three languages and rebuilt on a timer.
//
// The list is live data, which usually argues against static params — but it
// is data that changes a few times a day and is read by strangers who tapped
// somebody's card, so the right trade is a file served instantly and replaced
// every few minutes, not a query per visitor. The revalidate window matches
// the one on the fetch; it is stated here as well because a request that
// failed leaves no cache entry to inherit it from, and without it a page
// rendered while the backend was down would keep saying so.
export const revalidate = 300;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/residents">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "residentsPage" });

  return { title: t("metaTitle"), description: t("metaDescription") };
}

// Everyone holding a number, newest first.
//
// The social proof, and it has to be real proof: the rows are the rows the
// backend returned and nothing else. Which is why the unreachable case gets
// its own words instead of an empty grid — an empty grid on this page reads
// as "nobody has bought one", and that would be a lie told by a timeout.
export default async function ResidentsPage({
  params,
}: PageProps<"/[locale]/residents">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("residentsPage");
  const format = await getFormatter();

  const list = await catalogue();

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <h1 className="text-[34px] leading-10 font-semibold tracking-tight sm:text-[42px] sm:leading-[3rem]">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-2">{t("lead")}</p>

        {list && (
          <p className="mt-4 font-mono text-[13px] text-ink-3">
            {t("counts", {
              taken: format.number(list.band),
              free: format.number(list.jami - list.band),
            })}
          </p>
        )}

        {!list && (
          <div className="mt-10 rounded-tile border border-line bg-white p-6 sm:p-8">
            <h2 className="font-semibold">{t("downTitle")}</h2>
            <p className="mt-2 max-w-lg leading-relaxed text-ink-2">
              {t("downBody")}
            </p>
          </div>
        )}

        {list && list.residents.length === 0 && (
          <div className="mt-10 rounded-tile border border-dashed border-line-2 p-6 text-center sm:p-10">
            <h2 className="font-semibold">{t("emptyTitle")}</h2>
            <p className="mt-2 text-ink-2">{t("emptyBody")}</p>
            <Link
              href="/personal"
              className="mt-6 inline-flex h-12 items-center rounded-input bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-ink-s2"
            >
              {t("cta")}
            </Link>
          </div>
        )}

        {list && list.residents.length > 0 && (
          <>
            <p className="cap mt-10 text-ink-3">{t("newest")}</p>
            <ul className="mt-4 space-y-3">
              {list.residents.map((resident) => (
                <li key={resident.raqam}>
                  {/* A profile lives at the root — `/VIP777` — outside the
                      locale segment, because that is what is printed on the
                      card. `next/link` rather than the localised one, so the
                      href stays the address the proxy lets through. */}
                  <NextLink
                    href={`/${resident.raqam}`}
                    className="flex items-center gap-4 rounded-card border border-line bg-white px-4 py-4 transition-colors hover:border-line-lead sm:px-5"
                  >
                    <ResidentAvatar
                      name={resident.ism}
                      photo={resident.rasm}
                      size={48}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{resident.ism}</p>
                      <p className="font-mono text-xs tracking-[0.14em] text-ink-3">
                        {resident.raqam}
                      </p>
                      {resident.teglar.length > 0 && (
                        <p className="mt-1 truncate text-xs text-ink-3">
                          {resident.teglar.map((tag) => `#${tag}`).join(" ")}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right text-xs text-ink-3">
                      {resident.shahar && (
                        <span className="flex items-center justify-end gap-1">
                          <MapPin className="size-3" strokeWidth={2} />
                          {resident.shahar}
                        </span>
                      )}
                      <span className="mt-1 flex items-center justify-end gap-1">
                        <Eye className="size-3" strokeWidth={2} />
                        {t("views", { n: format.number(resident.korishlar) })}
                      </span>
                    </div>
                  </NextLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
