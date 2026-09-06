import type { Metadata } from "next";
import Link from "next/link";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import FollowRequestList from "@/components/FollowRequestList";
import { requireOwnHandle } from "@/lib/kabinet";
import { listFollowRequests } from "@/lib/follow-requests";

export const metadata: Metadata = { title: "Obuna so'rovlari", robots: { index: false } };

// Who is waiting at the door of a closed profile.
//
// Only meaningful when the profile is closed, and said so rather than shown
// empty: an owner who opens this on an open profile has not misunderstood the
// page, they have not yet closed the profile, and the fix is one switch away.
export default async function FollowRequestsPage({
  params,
}: PageProps<"/kabinet/[handle]/obuna-sorovlari">) {
  const { handle } = await params;
  const { normalized, owned } = await requireOwnHandle(handle, "/kabinet/[handle]/obuna-sorovlari");
  const { requests } = await listFollowRequests(normalized);

  return (
    <PageShell surface="ink">
      <SubScreen
        handle={normalized}
        title="Obuna so'rovlari"
        hint="Yopiq profilingizga kirmoqchi bo'lganlar. Qabul qilganingiz obunachi bo'ladi."
      >
        {!owned.isPrivate && (
          <p className="mb-4 rounded-card border border-ink-line bg-ink-s1 px-5 py-4 text-sm leading-relaxed text-paper-2">
            Profilingiz ochiq — obuna so&apos;rovsiz bo&apos;ladi.{" "}
            <Link href={`/kabinet/${normalized}/tahrirlash`} className="font-medium text-paper underline underline-offset-4">
              Yopiq qilish
            </Link>
          </p>
        )}

        <FollowRequestList
          handle={normalized}
          initial={requests}
          emptyMessage="Hozircha so'rov yo'q. Kimdir yopiq profilingizga obuna bo'lmoqchi bo'lsa, shu yerda ko'rinadi."
        />
      </SubScreen>
    </PageShell>
  );
}
