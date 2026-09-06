import NextLink from "next/link";
import { getFormatter } from "next-intl/server";

import ResidentAvatar from "@/components/ResidentAvatar";
import type { Post } from "@/lib/backend/feed";
import { segments } from "@/lib/post-text";

// A column of short posts.
//
// One column, and the same column on a laptop: reading does not get better
// wider, and a feed set in two columns is a feed nobody finishes. The card is
// the site's card — white on the paper ground, one hairline — because a post is
// not a different kind of object from a resident row.

export default async function PostList({ posts }: { posts: Post[] }) {
  const format = await getFormatter();

  return (
    <ul className="space-y-3">
      {posts.map((post) => (
        <li
          key={post.id}
          className="rounded-card border border-line bg-white px-4 py-4 sm:px-5"
        >
          <div className="flex items-start gap-3.5">
            {/* A profile lives at the root — `/VIP777` — outside the locale
                segment, because that address is engraved on a card;
                `src/proxy.ts` says why. Plain `next/link` keeps the href the
                address the proxy lets through. */}
            <NextLink href={`/${post.handle}`} className="shrink-0">
              <ResidentAvatar
                name={post.authorName ?? post.handle}
                photo={post.authorPhoto}
                size={40}
              />
            </NextLink>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <NextLink
                  href={`/${post.handle}`}
                  className="font-medium tracking-tight hover:underline"
                >
                  {post.authorName ?? post.handle}
                </NextLink>
                <span className="font-mono text-[11px] tracking-[0.14em] text-ink-3">
                  {post.handle}
                </span>
              </div>

              {/* Somebody else's words. Rendered as text — see
                  `lib/post-text.ts` for what that rules out — and wrapped,
                  so one unbroken 400-character string cannot stretch the
                  column past the edge of a phone. */}
              <p className="mt-1.5 text-sm leading-relaxed break-words whitespace-pre-wrap">
                {segments(post.body).map((part, i) =>
                  part.kind === "link" ? (
                    <a
                      key={i}
                      href={part.href}
                      target="_blank"
                      // `noopener` because a page opened from ours can
                      // otherwise steer this tab through `window.opener`, and
                      // `ugc nofollow` because a stranger wrote this link and
                      // our domain does not vouch for where it goes.
                      rel="ugc nofollow noopener noreferrer"
                      className="text-lime-ink underline underline-offset-2"
                    >
                      {part.text}
                    </a>
                  ) : (
                    <span key={i}>{part.text}</span>
                  ),
                )}
              </p>

              <p className="mt-2.5 text-[11px] text-ink-3">
                {format.relativeTime(new Date(post.at))}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
