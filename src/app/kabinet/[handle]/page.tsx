import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Download, UtensilsCrossed, BellRing } from "lucide-react";
import PageShell from "@/components/PageShell";
import EditProfileForm from "@/components/EditProfileForm";
import { requireUser } from "@/lib/auth";
import { getOwnedHandle } from "@/lib/handles";
import { parseHandle } from "@/lib/pricing";
import { linkFieldValue } from "@/lib/profile-form";
import StatsPanel from "@/components/StatsPanel";
import LeadsPanel from "@/components/LeadsPanel";
import { listLeads } from "@/lib/leads";
import PostComposer from "@/components/PostComposer";
import PostList from "@/components/PostList";
import { listPostsForHandle } from "@/lib/posts";
import { getHandleStats } from "@/lib/analytics";
import DesignRequestForm from "@/components/DesignRequestForm";
import { listDesignRequests } from "@/lib/design-requests";
import TransferPanel from "@/components/TransferPanel";
import { listTransfersForHandle } from "@/lib/transfers";
import { getOwnedVenue } from "@/lib/menu";
import { countWaiting } from "@/lib/venue-requests";

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
  const [stats, posts, designRequests, transfers, leads] = await Promise.all([
    getHandleStats(normalized),
    listPostsForHandle(normalized),
    listDesignRequests(normalized),
    listTransfersForHandle(normalized),
    listLeads(normalized, user.id),
  ]);

  // A venue is one row that most handles do not have; the count behind it is
  // only worth a query when there is one.
  const venue = await getOwnedVenue(normalized, user.id);
  const waiting = venue ? await countWaiting(venue.id) : 0;

  return (
    <PageShell>
      <Link
        href="/kabinet"
        className="mb-6 inline-flex items-center gap-1.5 self-start text-sm text-flex-black/50 transition-colors hover:text-flex-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Kabinet
      </Link>

      {/* Only for a number that is a place rather than a person. A cafe opens
          the cabinet to do one of two things — change the menu, or answer a
          table — so both are above everything else. */}
      {venue && (
        <section className="grain relative mb-6 overflow-hidden rounded-[1.75rem] bg-flex-black p-7 text-white">
          <div className="bg-dot-grid-light absolute inset-0 opacity-25" />

          <div className="relative">
            <h2 className="font-display text-lg font-semibold tracking-tight">{venue.name}</h2>
            <p className="mt-1 mb-5 text-sm text-white/50">
              Stol ustidagi belgining orqasi.
            </p>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Link
                href={`/kabinet/${normalized}/sorovlar`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-lime px-5 py-4 font-medium text-flex-black"
              >
                <span className="flex items-center gap-2">
                  <BellRing className="h-4 w-4" />
                  So&apos;rovlar
                </span>
                {waiting > 0 && (
                  <span className="rounded-lg bg-flex-black px-2.5 py-1 font-tabular text-sm text-lime">
                    {waiting}
                  </span>
                )}
              </Link>

              <Link
                href={`/kabinet/${normalized}/menyu`}
                className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-4 font-medium text-white"
              >
                <UtensilsCrossed className="h-4 w-4" />
                Menyu
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="rounded-[1.75rem] border border-black/10 bg-white p-7 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{normalized}</h1>
        <p className="mt-1 mb-7 font-tabular text-sm text-flex-black/40">
          flex.com.uz/{normalized}
        </p>

        <EditProfileForm
          handle={normalized}
          defaults={{
            name: owned.name,
            bio: owned.bio,
            booking: linkFieldValue(owned.links, "Uchrashuv"),
            telegram: linkFieldValue(owned.links, "Telegram"),
            whatsapp: linkFieldValue(owned.links, "WhatsApp"),
            instagram: linkFieldValue(owned.links, "Instagram"),
            linkedin: linkFieldValue(owned.links, "LinkedIn"),
            facebook: linkFieldValue(owned.links, "Facebook"),
            youtube: linkFieldValue(owned.links, "YouTube"),
            website: linkFieldValue(owned.links, "Veb-sayt"),
            city: owned.city ?? "",
            contactEmail: owned.contactEmail ?? "",
            phone: owned.phone ?? "",
            position: owned.position ?? "",
            company: owned.company ?? "",
            services: owned.services,
            plan: owned.plan,
            bannerUrl: owned.bannerUrl,
            teamName: owned.teamName,
            commentsOpen: owned.commentsOpen,
            tags: owned.tags.join(", "),
            cardDesign: owned.cardDesign,
            customDesignUrl: owned.customDesignUrl,
            deviceType: owned.deviceType,
          }}
        />
      </div>

      <section className="mt-6 rounded-[1.75rem] border border-black/10 bg-white p-7 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <h2 className="font-display text-lg font-semibold tracking-tight">Postlar</h2>
        <p className="mt-1 mb-5 text-sm text-flex-black/50">
          Obunachilaringiz lentasida va profilingizda ko&apos;rinadi.
        </p>

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
      </section>

      <div className="mt-6">
        <DesignRequestForm handle={normalized} requests={designRequests} />
      </div>

      <div className="mt-6">
        <TransferPanel handle={normalized} transfers={transfers} />
      </div>

      <div className="mt-6">
        <LeadsPanel handle={owned.normalized} leads={leads} plan={owned.plan} />

        <StatsPanel stats={stats} plan={owned.plan} />
      </div>

      <div
        id="qr"
        className="mt-6 scroll-mt-6 rounded-[1.75rem] border border-black/10 bg-white p-7 text-center shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]"
      >
        <h2 className="font-display text-lg font-semibold tracking-tight">QR-kod</h2>
        <p className="mt-1 text-sm text-flex-black/50">
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
