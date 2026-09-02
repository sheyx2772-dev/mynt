import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import PostComposer from "@/components/PostComposer";
import PostList from "@/components/PostList";
import { requireOwnHandle } from "@/lib/kabinet";
import { listPostsForHandle } from "@/lib/posts";

export const metadata: Metadata = { title: "Postlar — flex.com.uz", robots: { index: false } };

export default async function PostsPage({ params }: PageProps<"/kabinet/[handle]/postlar">) {
  const { handle } = await params;
  const { normalized, owned } = await requireOwnHandle(handle, "/kabinet/[handle]/postlar");
  const posts = await listPostsForHandle(normalized);

  return (
    <PageShell>
      <SubScreen
        handle={normalized}
        title="Postlar"
        hint="Obunachilaringiz lentasida va profilingizda ko'rinadi."
      >
        {owned.status === "claimed" ? (
          <PostComposer handle={normalized} />
        ) : (
          <p className="rounded-xl border border-dashed border-black/15 px-4 py-5 text-center text-sm text-flex-black/45">
            To&apos;lov yakunlangach post joylashingiz mumkin bo&apos;ladi.
          </p>
        )}

        {posts.length > 0 && (
          <div className="mt-6">
            <PostList posts={posts} canDelete />
          </div>
        )}
      </SubScreen>
    </PageShell>
  );
}
