import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import GiftList from "@/components/GiftList";
import { requireOwnHandle } from "@/lib/kabinet";
import { listGifts } from "@/lib/gifts";

export const metadata: Metadata = { title: "Sovg'alar", robots: { index: false } };

// What people have given this number, hidden ones included, each with a
// switch. The count on the profile only counts what is on the shelf.
export default async function GiftsPage({ params }: PageProps<"/kabinet/[handle]/sovgalar">) {
  const { handle } = await params;
  const { normalized } = await requireOwnHandle(handle, "/kabinet/[handle]/sovgalar");
  const shelf = await listGifts(normalized);

  return (
    <PageShell surface="ink">
      <SubScreen
        handle={normalized}
        title="Sovg'alar"
        hint="Sizga sovg'a qilingan stikerlar. Istalganini javondan olib qo'yishingiz mumkin."
      >
        <GiftList handle={normalized} initial={shelf.gifts} />
      </SubScreen>
    </PageShell>
  );
}
