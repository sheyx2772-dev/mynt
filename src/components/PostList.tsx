import Link from "next/link";
import { MessageSquare } from "lucide-react";

import DeletePostButton from "@/components/DeletePostButton";
import { timeAgo } from "@/lib/relative-time";
import type { Post } from "@/lib/posts";

// A feed of short posts, drawn the same way as everything else somebody keeps
// open: a black tile for the face, tight type, and the row arriving with a
// stagger rather than appearing all at once.
//
// The avatar is ink rather than lime. Lime is what the screen spends on the one
// thing it wants read — a count that matters, a button worth pressing — and a
// list of forty faces is not that.

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external R2 URL
      <img
        src={url}
        alt={name}
        className="h-10 w-10 shrink-0 rounded-xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flex-black font-display text-[12px] font-semibold tracking-tight text-white">
      {name
        .split(/\s+/)
        .map((p) => p[0] ?? "")
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </div>
  );
}

export default function PostList({
  posts,
  showAuthor = false,
  canDelete = false,
  emptyMessage = "Hali post yo'q.",
}: {
  posts: Post[];
  showAuthor?: boolean;
  canDelete?: boolean;
  emptyMessage?: string;
}) {
  if (posts.length === 0) {
    return (
      <section className="rounded-[1.5rem] border border-black/6 bg-white p-10 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.04]">
          <MessageSquare className="h-4 w-4 text-flex-black/35" />
        </span>
        <p className="mx-auto mt-4 max-w-xs text-[13px] leading-relaxed text-flex-black/50">
          {emptyMessage}
        </p>
      </section>
    );
  }

  return (
    <ul className="space-y-2.5">
      {posts.map((post, i) => (
        <li
          key={post.id}
          className="rise rounded-2xl border border-black/6 bg-white px-5 py-4 transition-shadow duration-300 hover:shadow-[0_6px_20px_-8px_rgba(14,10,27,0.18)]"
          // Capped: past the eighth row nobody is watching the animation.
          style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
        >
          <div className="flex items-start gap-3.5">
            {showAuthor && (
              <Link href={`/${post.handle}`} className="shrink-0">
                <Avatar
                  name={post.author?.name ?? post.handle}
                  url={post.author?.avatarUrl ?? null}
                />
              </Link>
            )}

            <div className="min-w-0 flex-1">
              {showAuthor && (
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Link
                    href={`/${post.handle}`}
                    className="text-[14px] font-semibold tracking-tight hover:underline"
                  >
                    {post.author?.name ?? post.handle}
                  </Link>
                  <span className="font-tabular text-[11px] text-flex-black/30">
                    {post.handle}
                  </span>
                </div>
              )}

              {/* User text: rendered as plain text, and wrapped so a long
                  unbroken string cannot stretch the layout. */}
              <p className="mt-1.5 text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                {post.body}
              </p>

              <p className="mt-2.5 font-tabular text-[11px] text-flex-black/30">
                {timeAgo(post.createdAt)}
              </p>
            </div>

            {canDelete && <DeletePostButton postId={post.id} />}
          </div>
        </li>
      ))}
    </ul>
  );
}
