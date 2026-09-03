import Link from "next/link";
import type { Metadata } from "next";
import { after } from "next/server";
import { ArrowRight, Rss, TrendingUp } from "lucide-react";

import PageShell from "@/components/PageShell";
import PostList from "@/components/PostList";
import { requireUser } from "@/lib/auth";
import { listFeed } from "@/lib/posts";
import { getTopHandles, listNewestResidents, touchLastSeen } from "@/lib/handles";

export const metadata: Metadata = {
  title: "Postlar — flex.com.uz",
  robots: { index: false },
};

// The feed.
//
// A column on a phone and a column on a laptop — reading does not get better
// wider — but on a laptop the space beside it stops being empty. What goes
// there is the answer to the only question an empty feed raises: whose posts
// would appear here, and where do I find them.

export default async function FeedPage() {
  const user = await requireUser("/lenta");

  const [posts, top, newest] = await Promise.all([
    listFeed(user.id),
    getTopHandles(3, 3),
    listNewestResidents(4),
  ]);

  after(() => touchLastSeen(user.id));

  return (
    <PageShell wide>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <div>
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-flex-black">
                <Rss className="h-4 w-4 text-lime" />
              </span>
              Postlar
            </h1>
            <Link
              href="/rezidentlar"
              className="flex items-center gap-1 text-[13px] text-flex-black/45 transition-colors hover:text-flex-black lg:hidden"
            >
              Rezidentlar
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <PostList
            posts={posts}
            showAuthor
            emptyMessage="Hozircha bo'sh. Rezidentlarga obuna bo'ling — ularning postlari shu yerda chiqadi."
          />
        </div>

        {/* Beside the feed once there is room, and never above it: on a phone
            the answer to "whose posts are these" is a tap away at /rezidentlar,
            and putting a discovery panel in front of the feed would make the
            feed the second thing on a page that exists for it. */}
        <aside className="hidden lg:sticky lg:top-8 lg:block lg:space-y-4">
          {top.length > 0 && (
            <section className="grain relative overflow-hidden rounded-[1.5rem] bg-flex-black p-5 text-white">
              <div className="bg-dot-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_100%_0%,black,transparent)]" />
              <div className="relative">
                <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] text-white/40 uppercase">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Uch kunda eng ko&apos;p ochilgan
                </p>
                <ul className="mt-4 space-y-3">
                  {top.map((entry, i) => (
                    <li key={entry.normalized}>
                      <Link
                        href={`/${entry.normalized}`}
                        className="flex items-center gap-3 transition-opacity hover:opacity-80"
                      >
                        <span className="font-tabular text-[11px] text-lime">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold tracking-tight">
                            {entry.name || entry.normalized}
                          </span>
                          <span className="block font-tabular text-[11px] text-white/35">
                            {entry.normalized}
                          </span>
                        </span>
                        <span className="font-tabular text-[12px] text-white/45">
                          {entry.views}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {newest.length > 0 && (
            <section className="rounded-[1.5rem] border border-black/6 bg-white p-5">
              <p className="text-[11px] font-medium tracking-[0.12em] text-flex-black/40 uppercase">
                Yangi rezidentlar
              </p>
              <ul className="mt-3.5 space-y-2.5">
                {newest.map((resident) => (
                  <li key={resident.normalized}>
                    <Link
                      href={`/${resident.normalized}`}
                      className="flex items-center gap-3 transition-opacity hover:opacity-70"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.05] font-display text-[11px] font-semibold text-flex-black/70">
                        {(resident.name || resident.normalized)
                          .split(/\s+/)
                          .map((p) => p[0] ?? "")
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">
                          {resident.name || resident.normalized}
                        </span>
                        <span className="block font-tabular text-[11px] text-flex-black/35">
                          {resident.normalized}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href="/rezidentlar"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-black/[0.04] px-4 py-2.5 text-[12px] font-medium text-flex-black/60 transition-colors hover:bg-black/[0.07] hover:text-flex-black"
              >
                Hammasi
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
