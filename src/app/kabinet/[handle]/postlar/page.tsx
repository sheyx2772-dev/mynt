import type { Metadata } from "next";
import { Clock } from "lucide-react";

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
          <section className="rounded-[1.5rem] border border-black/6 bg-white p-8 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.04]">
              <Clock className="h-4 w-4 text-flex-black/35" />
            </span>
            <p className="mx-auto mt-4 max-w-xs text-[13px] leading-relaxed text-flex-black/50">
              To&apos;lov yakunlangach post joylashingiz mumkin bo&apos;ladi.
            </p>
          </section>
        )}

        <div className="mt-6">
          <PostList
            posts={posts}
            canDelete
            emptyMessage="Hali post yo'q. Yozganingiz obunachilaringiz lentasida va profilingizda ko'rinadi."
          />
        </div>
      </SubScreen>
    </PageShell>
  );
}
