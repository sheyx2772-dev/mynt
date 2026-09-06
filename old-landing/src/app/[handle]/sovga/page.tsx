import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import PageShell from "@/components/PageShell";
import GiftPicker from "@/components/GiftPicker";
import { getUser } from "@/lib/auth";
import { getClaimedProfile } from "@/lib/handles";
import { listStickers } from "@/lib/gifts";
import { parseHandle } from "@/lib/pricing";

export const metadata: Metadata = { title: "Sovg'a qilish", robots: { index: false } };

// Giving somebody a sticker. Its own screen rather than a sheet on the
// profile: it ends on a payment page, and a person about to pay should be
// looking at exactly what they are paying for and whom it is for.
export default async function GiftPage({ params }: PageProps<"/[handle]/sovga">) {
  const { handle } = await params;
  const parsed = parseHandle(handle);
  if (!parsed) notFound();
  const normalized = `${parsed.letters}${parsed.digits}`;

  const [profile, stickers, user] = await Promise.all([
    getClaimedProfile(normalized),
    listStickers(),
    getUser(),
  ]);
  if (!profile) notFound();

  return (
    <PageShell surface="ink">
      <div className="mx-auto max-w-md px-5 py-6">
        <Link href={`/${normalized}`} className="flex items-center gap-1.5 text-sm text-paper-2">
          <ArrowLeft className="size-4" strokeWidth={1.8} aria-hidden />
          {profile.name}
        </Link>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">Sovg&apos;a qilish</h1>
        <p className="mt-1 text-sm text-paper-2">
          Stiker {profile.name} profilida javonda turadi, egasiga darhol xabar boradi.
        </p>
        <div className="mt-5">
          <GiftPicker handle={normalized} name={profile.name} stickers={stickers} signedIn={Boolean(user)} />
        </div>
      </div>
    </PageShell>
  );
}
