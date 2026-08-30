import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Download } from "lucide-react";
import PageShell from "@/components/PageShell";
import EditProfileForm from "@/components/EditProfileForm";
import { requireUser } from "@/lib/auth";
import { getOwnedHandle } from "@/lib/handles";
import { parseHandle } from "@/lib/pricing";
import { linkFieldValue } from "@/lib/profile-form";
import StatsPanel from "@/components/StatsPanel";
import PostComposer from "@/components/PostComposer";
import PostList from "@/components/PostList";
import { listPostsForHandle } from "@/lib/posts";
import { getHandleStats } from "@/lib/analytics";

export async function generateMetadata(
  props: PageProps<"/kabinet/[handle]">
): Promise<Metadata> {
  const { handle } = await props.params;
  return { title: `${handle.toUpperCase()} — tahrirlash`, robots: { index: false } };
}

export default async function EditHandlePage(props: PageProps<"/kabinet/[handle]">) {
  const { handle } = await props.params;

  const parsed = parseHandle(handle);
  if (!parsed) notFound();

  const normalized = `${parsed.letters}${parsed.digits}`;
  const user = await requireUser(`/kabinet/${normalized}`);

  // Returns null for a handle the user does not own, so a guessed URL is a
  // 404 rather than someone else's edit form.
  const owned = await getOwnedHandle(normalized, user.id);
  if (!owned) notFound();

  // Only reached once ownership is established above.
  const [stats, posts] = await Promise.all([
    getHandleStats(normalized),
    listPostsForHandle(normalized),
  ]);

  return (
    <PageShell>
      <Link
        href="/kabinet"
        className="mb-6 inline-flex items-center gap-1.5 self-start text-sm text-mynt-black/50 transition-colors hover:text-mynt-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Kabinet
      </Link>

      <div className="rounded-[1.75rem] border border-black/10 bg-white p-7 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{normalized}</h1>
        <p className="mt-1 mb-7 font-tabular text-sm text-mynt-black/40">
          mynt.uz/{normalized}
        </p>

        <EditProfileForm
          handle={normalized}
          defaults={{
            name: owned.name,
            bio: owned.bio,
            telegram: linkFieldValue(owned.links, "Telegram"),
            instagram: linkFieldValue(owned.links, "Instagram"),
            website: linkFieldValue(owned.links, "Veb-sayt"),
            city: owned.city ?? "",
            contactEmail: owned.contactEmail ?? "",
            tags: owned.tags.join(", "),
            cardDesign: owned.cardDesign,
          }}
        />
      </div>

      <section className="mt-6 rounded-[1.75rem] border border-black/10 bg-white p-7 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <h2 className="font-display text-lg font-semibold tracking-tight">Postlar</h2>
        <p className="mt-1 mb-5 text-sm text-mynt-black/50">
          Obunachilaringiz lentasida va profilingizda ko&apos;rinadi.
        </p>

        {owned.status === "claimed" ? (
          <PostComposer handle={normalized} />
        ) : (
          <p className="rounded-xl border border-dashed border-black/15 px-4 py-5 text-center text-sm text-mynt-black/45">
            To&apos;lov yakunlangach post joylashingiz mumkin bo&apos;ladi.
          </p>
        )}

        {posts.length > 0 && (
          <div className="mt-6">
            <PostList posts={posts} canDelete />
          </div>
        )}
      </section>

      <div className="mt-6">
        <StatsPanel stats={stats} />
      </div>

      <div
        id="qr"
        className="mt-6 scroll-mt-6 rounded-[1.75rem] border border-black/10 bg-white p-7 text-center shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]"
      >
        <h2 className="font-display text-lg font-semibold tracking-tight">QR-kod</h2>
        <p className="mt-1 text-sm text-mynt-black/50">
          NFC ishlamaydigan telefonlar uchun zaxira. Kartaga bosish uchun ham shu kod.
        </p>

        <div className="mx-auto mt-6 w-44 rounded-2xl border border-black/10 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- an SVG route, not an optimizable asset */}
          <img
            src={`/${normalized}/qr`}
            alt={`${normalized} uchun QR-kod`}
            className="h-full w-full"
          />
        </div>

        <a
          href={`/${normalized}/qr`}
          download={`${normalized}-qr.svg`}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.03]"
        >
          <Download className="h-3.5 w-3.5" />
          SVG yuklab olish
        </a>
      </div>
    </PageShell>
  );
}
