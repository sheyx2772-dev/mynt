import Link from "next/link";
import DeletePostButton from "@/components/DeletePostButton";
import { timeAgo } from "@/lib/relative-time";
import type { Post } from "@/lib/posts";

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external R2 URL
      <img src={url} alt={name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime font-display text-xs font-semibold text-flex-black">
      {name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")}
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
      <p className="rounded-2xl border border-dashed border-black/15 px-5 py-10 text-center text-sm text-flex-black/45">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {posts.map((post) => (
        <li
          key={post.id}
          className="rounded-2xl border border-black/10 bg-white px-5 py-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            {showAuthor && (
              <Link href={`/${post.handle}`} className="shrink-0">
                <Avatar name={post.author?.name ?? post.handle} url={post.author?.avatarUrl ?? null} />
              </Link>
            )}

            <div className="min-w-0 flex-1">
              {showAuthor && (
                <p className="text-sm">
                  <Link href={`/${post.handle}`} className="font-medium hover:underline">
                    {post.author?.name ?? post.handle}
                  </Link>{" "}
                  <span className="font-tabular text-xs text-flex-black/35">
                    flex.com.uz/{post.handle}
                  </span>
                </p>
              )}

              {/* User text: rendered as plain text, and wrapped so a long
                  unbroken string cannot stretch the layout. */}
              <p className="mt-1 text-sm break-words whitespace-pre-wrap text-flex-black/80">
                {post.body}
              </p>

              <p className="mt-2 text-xs text-flex-black/30">{timeAgo(post.createdAt)}</p>
            </div>

            {canDelete && <DeletePostButton postId={post.id} />}
          </div>
        </li>
      ))}
    </ul>
  );
}
