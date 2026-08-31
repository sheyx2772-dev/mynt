import Link from "next/link";
import type { Metadata } from "next";
import { after } from "next/server";
import PageShell from "@/components/PageShell";
import PostList from "@/components/PostList";
import { requireUser } from "@/lib/auth";
import { listFeed } from "@/lib/posts";
import { touchLastSeen } from "@/lib/handles";

export const metadata: Metadata = {
  title: "Lenta — flex.uz",
  robots: { index: false },
};

export default async function FeedPage() {
  const user = await requireUser("/lenta");
  const posts = await listFeed(user.id);

  after(() => touchLastSeen(user.id));

  return (
    <PageShell>
      <div className="mb-7 flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Lenta</h1>
        <Link href="/rezidentlar" className="text-sm text-flex-black/45 hover:text-flex-black">
          Rezidentlar
        </Link>
      </div>

      <PostList
        posts={posts}
        showAuthor
        emptyMessage="Lentangiz bo'sh. Rezidentlarga obuna bo'ling — ularning postlari shu yerda chiqadi."
      />
    </PageShell>
  );
}
