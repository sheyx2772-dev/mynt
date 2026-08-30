import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { Nfc, Eye, MapPin, Mail } from "lucide-react";
import { parseHandle, parseGenesisSerial, priceForHandle, letterRarity, digitRarity } from "@/lib/pricing";
import { formatUZS } from "@/lib/format";
import { getClaimedProfile, getGenesisCard } from "@/lib/handles";
import SaveContactButton from "@/components/SaveContactButton";
import ClaimForm from "@/components/ClaimForm";
import PageShell from "@/components/PageShell";
import { getUser } from "@/lib/auth";
import { isAnyProviderConfigured } from "@/lib/payments/config";
import { readVisitorContext, recordProfileView } from "@/lib/analytics";
import { timeAgo } from "@/lib/relative-time";
import { listPostsForHandle } from "@/lib/posts";
import { countFollowing, isFollowing } from "@/lib/follows";
import FollowButton from "@/components/FollowButton";
import PostList from "@/components/PostList";

export async function generateMetadata(props: PageProps<"/[handle]">): Promise<Metadata> {
  const { handle } = await props.params;
  const title = `${handle.toUpperCase()} — mynt.uz`;

  // Only pages with a real person or a real card behind them are worth
  // indexing. An unclaimed handle is a price quote, and there are 17.5M of
  // them — letting crawlers in would bury the profiles that matter.
  const serial = parseGenesisSerial(handle);
  if (serial) {
    const card = await getGenesisCard(serial);
    return { title, robots: card ? undefined : { index: false } };
  }

  const parsed = parseHandle(handle);
  if (!parsed) return { title, robots: { index: false } };

  const profile = await getClaimedProfile(`${parsed.letters}${parsed.digits}`);
  return { title, robots: profile ? undefined : { index: false } };
}

export default async function HandlePage(props: PageProps<"/[handle]">) {
  const { handle } = await props.params;
  const { bolim } = await props.searchParams;

  const genesisSerial = parseGenesisSerial(handle);
  if (genesisSerial) {
    return <GenesisCardPage serial={genesisSerial} />;
  }

  const parsed = parseHandle(handle);
  // Neither a handle nor a serial — render the 404 page with a 404 status
  // rather than a 200 that invites crawlers to index every typo.
  if (!parsed) notFound();

  return (
    <VanityHandlePage
      letters={parsed.letters}
      digits={parsed.digits}
      tab={bolim === "postlar" ? "postlar" : "vizitka"}
    />
  );
}

async function VanityHandlePage({
  letters,
  digits,
  tab,
}: {
  letters: string;
  digits: string;
  tab: "vizitka" | "postlar";
}) {
  const normalized = `${letters}${digits}`;
  const profile = await getClaimedProfile(normalized);

  if (profile) {
    const viewer = await getUser();
    const isOwner = Boolean(viewer && profile.userId && viewer.id === profile.userId);

    // Owners looking at their own page would otherwise inflate their numbers.
    // Recorded after the response so it never delays the profile.
    if (!isOwner) {
      const visitor = await readVisitorContext();
      after(() => recordProfileView(normalized, visitor));
    }

    const lastSeen = timeAgo(profile.lastSeenAt);

    const [following, followingCount, posts] = await Promise.all([
      viewer ? isFollowing(viewer.id, normalized) : Promise.resolve(false),
      profile.userId ? countFollowing(profile.userId) : Promise.resolve(0),
      tab === "postlar" ? listPostsForHandle(normalized) : Promise.resolve([]),
    ]);

    return (
      <PageShell>
        <div className="grain card-sheen relative overflow-hidden rounded-[1.75rem] bg-mynt-black p-8 text-white shadow-[0_35px_70px_-25px_rgba(14,10,27,0.55)]">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, avoids next.config remotePatterns coupling
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="relative h-16 w-16 rounded-full object-cover shadow-[0_10px_24px_-8px_rgba(171,255,9,0.6)]"
            />
          ) : (
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-lime font-display text-xl font-semibold text-mynt-black shadow-[0_10px_24px_-8px_rgba(171,255,9,0.6)]">
              {profile.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </div>
          )}
          <h1 className="relative mt-5 font-display text-2xl font-semibold">{profile.name}</h1>
          <p className="relative mt-1 font-tabular text-sm text-white/50">mynt.uz/{normalized}</p>

          {lastSeen && (
            <p className="relative mt-2 text-xs text-white/40">Oxirgi faollik: {lastSeen}</p>
          )}

          {profile.bio && <p className="relative mt-4 text-sm text-white/70">{profile.bio}</p>}

          {profile.tags.length > 0 && (
            <div className="relative mt-4 flex flex-wrap gap-2">
              {profile.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="relative mt-6 flex gap-6 border-t border-white/10 pt-5">
            <div>
              <p className="font-display text-lg font-semibold tabular-nums">
                {profile.followerCount}
              </p>
              <p className="text-xs text-white/40">Obunachi</p>
            </div>
            <div>
              <p className="font-display text-lg font-semibold tabular-nums">{followingCount}</p>
              <p className="text-xs text-white/40">Obuna</p>
            </div>
            <div>
              <p className="font-display text-lg font-semibold tabular-nums">
                {profile.viewCount}
              </p>
              <p className="flex items-center gap-1 text-xs text-white/40">
                <Eye className="h-3 w-3" />
                Ko&apos;rish
              </p>
            </div>
          </div>

          {!isOwner && (
            <div className="relative mt-5">
              <FollowButton handle={normalized} initialFollowing={following} />
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-6 border-b border-black/10 text-sm">
          <Link
            href={`/${normalized}`}
            className={
              tab === "vizitka"
                ? "-mb-px border-b-2 border-mynt-black pb-2.5 font-medium"
                : "-mb-px border-b-2 border-transparent pb-2.5 text-mynt-black/45 transition-colors hover:text-mynt-black"
            }
          >
            Vizitka
          </Link>
          <Link
            href={`/${normalized}?bolim=postlar`}
            className={
              tab === "postlar"
                ? "-mb-px flex items-center gap-1.5 border-b-2 border-mynt-black pb-2.5 font-medium"
                : "-mb-px flex items-center gap-1.5 border-b-2 border-transparent pb-2.5 text-mynt-black/45 transition-colors hover:text-mynt-black"
            }
          >
            Postlar
            {profile.postCount > 0 && (
              <span className="font-tabular text-xs text-mynt-black/35">{profile.postCount}</span>
            )}
          </Link>
        </div>

        {tab === "vizitka" ? (
          <>
          <div className="mt-6">
            <SaveContactButton fullName={profile.name} handle={normalized} bio={profile.bio} />
          </div>

          {isOwner && (
            <Link
              href={`/kabinet/${normalized}`}
              className="mt-3 block rounded-full border border-black/10 px-6 py-3 text-center text-sm font-medium transition-colors hover:bg-black/[0.03]"
            >
              Profilni tahrirlash
            </Link>
          )}

          <div className="mt-6 space-y-3">
            {profile.links.map((link, index) => (
              <a
                key={link.href}
                // Routed through /go so the click is counted; the destination is
                // resolved from this index server-side, not from the URL.
                href={`/${normalized}/go?to=${index}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-black/10 bg-white px-5 py-3 text-center font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {link.label}
              </a>
            ))}
          </div>

          {(profile.city || profile.contactEmail) && (
            <div className="mt-6 rounded-xl border border-black/10 bg-white px-5 py-4">
              <p className="mb-3 text-xs font-medium tracking-wide text-mynt-black/40 uppercase">
                Kontaktlar
              </p>
              {profile.city && (
                <p className="flex items-center gap-2 text-sm text-mynt-black/70">
                  <MapPin className="h-4 w-4 text-mynt-black/35" />
                  {profile.city}
                </p>
              )}
              {profile.contactEmail && (
                <p className="mt-2 flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-mynt-black/35" />
                  <a
                    href={`mailto:${profile.contactEmail}`}
                    className="text-mynt-black/70 underline-offset-2 hover:underline"
                  >
                    {profile.contactEmail}
                  </a>
                </p>
              )}
            </div>
          )}
          </>
        ) : (
          <div className="mt-6">
            <PostList
              posts={posts}
              emptyMessage={
                isOwner
                  ? "Hali post yozmadingiz. Kabinetdan birinchi postni joylang."
                  : "Bu profilda hali post yo'q."
              }
            />
          </div>
        )}
      </PageShell>
    );
  }

  // Handle isn't claimed yet — show the rarity price breakdown and a claim CTA.
  const price = priceForHandle(letters, digits);
  const lr = letterRarity(letters);
  const dr = digitRarity(digits);
  const isSignedIn = Boolean(await getUser());

  return (
    <PageShell>
      <div className="relative rounded-[1.75rem] border border-black/10 bg-white p-8 text-center shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <p className="inline-block rounded-full bg-lime/20 px-3 py-1 text-xs font-semibold tracking-wide text-mynt-black/70 uppercase">
          Bo&apos;sh
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">{normalized}</h1>
        <p className="mt-1 text-sm text-mynt-black/50">mynt.uz/{normalized}</p>

        <div className="mt-8 space-y-1 text-left font-tabular text-sm">
          <div className="flex justify-between border-b border-black/5 py-2.5">
            <span>Harf kamyobligi — {lr.reason}</span>
            <span className="font-semibold">&times;{lr.multiplier}</span>
          </div>
          <div className="flex justify-between border-b border-black/5 py-2.5">
            <span>Raqam kamyobligi — {dr.reason}</span>
            <span className="font-semibold">&times;{dr.multiplier}</span>
          </div>
          <div className="flex justify-between pt-4 font-display text-lg font-semibold">
            <span>Narx</span>
            <span>{formatUZS(price)}</span>
          </div>
        </div>

        <ClaimForm
          handle={normalized}
          priceLabel={formatUZS(price)}
          isSignedIn={isSignedIn}
          paymentEnabled={isAnyProviderConfigured}
        />
      </div>
    </PageShell>
  );
}

async function GenesisCardPage({ serial }: { serial: string }) {
  const card = await getGenesisCard(serial);

  return (
    <PageShell>
      <div className="grain card-sheen relative overflow-hidden rounded-[1.75rem] bg-mynt-black p-8 text-white shadow-[0_35px_70px_-25px_rgba(14,10,27,0.55)]">
        <div className="relative flex items-center justify-between text-xs text-white/50">
          <span className="font-medium tracking-wide uppercase">MYNT CARD</span>
          <Nfc className="h-5 w-5 text-white/40" />
        </div>
        <div className="relative mt-10 font-display text-4xl font-semibold tracking-tight">
          #<span className="text-lime">{serial}</span>
        </div>
        <p className="relative mt-1 font-tabular text-sm text-white/50">mynt.uz/{serial}</p>

        {card?.status === "claimed" ? (
          <div className="relative mt-8 border-t border-white/10 pt-6">
            <p className="text-xs tracking-wide text-white/40 uppercase">Egasi</p>
            <p className="mt-1 font-display text-lg font-semibold">{card.ownerName}</p>
            {card.mintedAt && (
              <p className="mt-1 text-xs text-white/40">Ishlab chiqarilgan: {card.mintedAt}</p>
            )}
          </div>
        ) : (
          <div className="relative mt-8 border-t border-white/10 pt-6">
            <p className="text-sm text-white/60">
              {card ? "Bu karta hali egasiga topshirilmagan." : "Bu seriya raqami hali chiqarilmagan."}
            </p>
          </div>
        )}
      </div>

      {card?.status === "claimed" && card.ownerHandle && (
        <Link
          href={`/${card.ownerHandle.toLowerCase()}`}
          className="mt-6 block rounded-full bg-lime px-6 py-3 text-center font-medium text-mynt-black shadow-[0_12px_30px_-10px_rgba(171,255,9,0.65)] transition-transform hover:scale-[1.01]"
        >
          Profilni ko&apos;rish
        </Link>
      )}

      <p className="mt-6 text-center text-xs text-mynt-black/40">
        MYNT CARD — ishlab chiqarilish tartibidagi noyob seriya raqami. Har bir karta faqat
        bitta marta chiqariladi va qayta ishlab chiqarilmaydi.
      </p>
    </PageShell>
  );
}
