import Mark from "@/components/Mark";
import LangSwitch from "@/components/LangSwitch";
import { site } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import Link from "next/link";
import type { Metadata } from "next";
import { Eye, MapPin, Search, Trophy } from "lucide-react";
import { listResidents, getTopHandles, getDirectoryCounts } from "@/lib/handles";
import { formatNumber } from "@/lib/format";
import { timeAgo } from "@/lib/relative-time";

export const metadata: Metadata = {
  title: "Rezidentlar — flex.com.uz",
  description: "Flex handle egalari: shaxsiy profillar, shaharlar va yo'nalishlar.",
};

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external R2 URL
      <img src={url} alt={name} className="h-11 w-11 shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime font-display text-sm font-semibold text-flex-black">
      {name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")}
    </div>
  );
}

export default async function ResidentsPage(props: PageProps<"/rezidentlar">) {
  const { q, til } = await props.searchParams;
  const query = typeof q === "string" ? q : "";
  const lang = await getLang(til);
  const t = site(lang);

  const [residents, top, counts] = await Promise.all([
    listResidents(query),
    getTopHandles(3, 3),
    getDirectoryCounts(),
  ]);

  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="absolute -top-24 right-[-6rem] h-80 w-80 rounded-full bg-lime/20 blur-[100px]" />

      <div className="relative mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="mb-10 flex items-center gap-2 font-display text-lg font-semibold">
          <Mark />
          flex
        </Link>

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.navResidents}
          </h1>
          <LangSwitch lang={lang} next="/rezidentlar" />
        </div>
        <p className="mt-2 font-tabular text-sm text-flex-black/50">
          {t.handleCounts(
            formatNumber(counts.claimed),
            formatNumber(counts.namespace - counts.claimed),
          )}
        </p>

        {/* The showcase is the sibling of this page — this lists the handles
            people actually hold, that shows what a card can look like. It is
            noindexed, so this link is the only way anyone arrives at it. */}
        <Link
          href="/katalog"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-flex-black/60 underline-offset-4 hover:text-flex-black hover:underline"
        >
          {lang === "ru" ? "Образцы карточек и макеты" : "Karta namunalari va maketlar"}
          <span aria-hidden>→</span>
        </Link>

        <form className="mt-7 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-flex-black/30" />
            <input
              name="q"
              defaultValue={query}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-full border border-black/10 bg-white py-3 pr-4 pl-11 text-sm outline-none transition-colors focus:border-flex-black/30"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-flex-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-flex-black/85"
          >
            {t.searchWord}
          </button>
        </form>

        {top.length > 0 && !query && (
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-medium tracking-wide text-flex-black/45 uppercase">
              <Trophy className="h-3.5 w-3.5" />
              {t.topThree}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {top.map((entry, index) => (
                <Link
                  key={entry.normalized}
                  href={`/${entry.normalized}`}
                  className="relative overflow-hidden rounded-2xl bg-flex-black p-5 text-white transition-transform hover:-translate-y-0.5"
                >
                  <span className="relative font-display text-xs text-lime">#{index + 1}</span>
                  <p className="relative mt-3 font-display font-semibold">{entry.name}</p>
                  <p className="relative font-tabular text-xs text-white/45">
                    flex.com.uz/{entry.normalized}
                  </p>
                  <p className="relative mt-3 flex items-center gap-1.5 font-tabular text-xs text-white/35">
                    <Eye className="h-3 w-3" />
                    {entry.views}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          {residents.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-black/15 px-6 py-14 text-center">
              <p className="text-sm text-flex-black/55">
                {query
                  ? t.nothingFound(query)
                  : t.noResidents}
              </p>
              <Link
                href={query ? "/rezidentlar" : "/shaxsiy#narx"}
                className="mt-6 inline-block rounded-full bg-lime px-6 py-3 font-medium text-flex-black transition-transform hover:scale-[1.01]"
              >
                {query ? t.seeAll : t.pickHandleCta}
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {residents.map((resident) => {
                const seen = timeAgo(resident.lastSeenAt);
                return (
                  <li key={resident.normalized}>
                    <Link
                      href={`/${resident.normalized}`}
                      className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Avatar name={resident.name} url={resident.avatarUrl} />

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{resident.name}</p>
                        <p className="font-tabular text-xs text-flex-black/40">
                          flex.com.uz/{resident.normalized}
                        </p>
                        {resident.tags.length > 0 && (
                          <p className="mt-1 truncate text-xs text-flex-black/45">
                            {resident.tags.map((tag) => `#${tag}`).join(" ")}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        {resident.city && (
                          <p className="flex items-center justify-end gap-1 text-xs text-flex-black/50">
                            <MapPin className="h-3 w-3" />
                            {resident.city}
                          </p>
                        )}
                        <p className="mt-1 flex items-center justify-end gap-1 font-tabular text-xs text-flex-black/35">
                          <Eye className="h-3 w-3" />
                          {resident.viewCount}
                        </p>
                        {seen && <p className="mt-1 text-[11px] text-flex-black/25">{seen}</p>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
