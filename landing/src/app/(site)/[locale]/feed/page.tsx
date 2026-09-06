import type { Metadata } from "next";
import NextLink from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import PostList from "@/components/PostList";
import ResidentAvatar from "@/components/ResidentAvatar";
import { Link } from "@/i18n/navigation";
import { feed } from "@/lib/backend/feed";
import { directory } from "@/lib/backend/residents";

// No `generateStaticParams` here, and that is the decision this page turns on.
//
// Every other page in this folder is the same page for everybody, so three
// files are prerendered and served from disk. This one is a different page for
// every reader — it is their subscriptions, read with their session — and there
// is no version of it that could be built in advance. Prerendering it would
// mean either baking one reader's feed into a file three languages deep, or
// building the signed-out page and then serving it to people who are signed in.
//
// `force-dynamic` is belt as well as braces: reading the session cookie already
// opts this route out of static rendering, and saying so here means a later
// experiment with partial prerendering cannot quietly cache one reader's
// column and hand it to the next.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/feed">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "feed" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // Nothing here belongs in an index. A crawler is signed out, so the only
    // page it can ever reach is the explanation — and an explanation of a feed
    // ranking for the feed is the wrong result for whoever searched.
    robots: { index: false },
  };
}

// The posts written by the numbers a reader follows.
//
// A column on a phone and the same column on a laptop. What fills the space
// beside it on a wide screen is the answer to the only question an empty feed
// raises: whose posts would appear here, and where do I find them.
export default async function FeedPage({
  params,
}: PageProps<"/[locale]/feed">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("feed");

  const [posts, dir] = await Promise.all([feed(), directory()]);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <h1 className="text-[34px] leading-10 font-semibold tracking-tight sm:text-[42px] sm:leading-[3rem]">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-2">{t("lead")}</p>

        {posts.state === "anonymous" ? (
          <section className="mt-10 rounded-tile border border-line bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("signedOutTitle")}
            </h2>
            <p className="mt-2 max-w-lg leading-relaxed text-ink-2">
              {t("signedOutBody")}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/login"
                className="inline-flex h-12 items-center rounded-input bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-ink-s2"
              >
                {t("signIn")}
              </Link>
              <Link
                href="/residents"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
              >
                {t("browse")}
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </div>
          </section>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
            <div>
              {posts.state === "down" && (
                <section className="rounded-tile border border-line bg-white p-6 sm:p-8">
                  <h2 className="font-semibold">{t("downTitle")}</h2>
                  <p className="mt-2 max-w-lg leading-relaxed text-ink-2">
                    {t("downBody")}
                  </p>
                </section>
              )}

              {posts.state === "ready" && posts.posts.length === 0 && (
                <section className="rounded-tile border border-dashed border-line-2 p-6 text-center sm:p-10">
                  <h2 className="font-semibold">{t("emptyTitle")}</h2>
                  <p className="mx-auto mt-2 max-w-sm leading-relaxed text-ink-2">
                    {t("emptyBody")}
                  </p>
                  <Link
                    href="/residents"
                    className="mt-6 inline-flex h-12 items-center rounded-input bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-ink-s2"
                  >
                    {t("browse")}
                  </Link>
                </section>
              )}

              {posts.state === "ready" && posts.posts.length > 0 && (
                <PostList posts={posts.posts} />
              )}
            </div>

            {/* Beside the feed once there is room, and never above it. On a
                phone the answer to "whose posts are these" is one tap away at
                /residents, and putting a discovery panel in front of the feed
                would make the feed the second thing on the page that exists
                for it. */}
            {dir && dir.newest.length > 0 && (
              <aside className="hidden lg:sticky lg:top-24 lg:block">
                <div className="rounded-tile border border-line bg-white p-6">
                  <p className="cap text-ink-3">{t("asideTitle")}</p>

                  <ul className="mt-4 space-y-3">
                    {dir.newest.slice(0, 5).map((resident) => (
                      <li key={resident.raqam}>
                        {/* A profile sits outside the locale prefix at
                            `/VIP777`; `src/proxy.ts` says why. */}
                        <NextLink
                          href={`/${resident.raqam}`}
                          className="flex items-center gap-3 transition-opacity hover:opacity-70"
                        >
                          <ResidentAvatar
                            name={resident.ism}
                            photo={resident.rasm}
                            size={34}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium">
                              {resident.ism}
                            </span>
                            <span className="block font-mono text-[11px] tracking-[0.12em] text-ink-3">
                              {resident.raqam}
                            </span>
                          </span>
                        </NextLink>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/residents"
                    className="mt-5 flex h-10 items-center justify-center gap-1.5 rounded-input bg-fill text-[13px] font-medium text-ink-2 transition-colors hover:text-ink"
                  >
                    {t("asideAll")}
                    <ArrowRight className="size-3.5" strokeWidth={2} />
                  </Link>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
